#!/usr/bin/env ruby

require "csv"
require "json"
require "nokogiri"
require "pathname"
require "set"

ROOT = Pathname.new(__dir__).join("..").expand_path
PLAN = ROOT.join("planning/chocoandinotours-page-plan-2026-09-22.csv")

def local_file_for(path)
  clean = path.sub(%r{\A/}, "")
  clean.empty? ? ROOT.join("index.html") : ROOT.join(clean, "index.html")
end

def normalized_path(href)
  return nil if href.nil? || href.empty? || href.start_with?("#", "mailto:", "tel:", "javascript:")
  uri = URI.parse(href)
  return nil if uri.host && uri.host != "chocoandinotours.com" && uri.host != "www.chocoandinotours.com" && uri.host != "staging.chocoandinotours.com"
  path = uri.path
  return "/" if path.nil? || path.empty?
  path.end_with?("/") || File.extname(path) != "" ? path : "#{path}/"
rescue URI::InvalidURIError
  nil
end

def schema_types(value, types = Set.new)
  case value
  when Hash
    Array(value["@type"]).each { |type| types << type }
    value.each_value { |child| schema_types(child, types) }
  when Array
    value.each { |child| schema_types(child, types) }
  end
  types
end

require "uri"

rows = CSV.read(PLAN, headers: true)
planned_paths = rows.select { |row| row["sitemap_include"] == "yes" }.map { |row| row["page_path"] }.to_set
issues = []
records = []
titles = Hash.new { |hash, key| hash[key] = [] }
descriptions = Hash.new { |hash, key| hash[key] = [] }

rows.each do |row|
  path = row["page_path"]
  file = local_file_for(path)
  unless file.file?
    issues << ["critical", path, "missing_file", file.relative_path_from(ROOT).to_s]
    next
  end

  doc = Nokogiri::HTML(file.read)
  title = doc.at_css("title")&.text&.strip.to_s
  description = doc.at_css('meta[name="description"]')&.[]("content").to_s.strip
  canonical = doc.at_css('link[rel="canonical"]')&.[]("href").to_s
  alternates = doc.css('link[rel="alternate"][hreflang]').to_h { |node| [node["hreflang"], node["href"]] }
  h1s = doc.css("h1")
  schemas = doc.css('script[type="application/ld+json"]')
  images = doc.css("img")
  word_count = doc.at_css("main")&.text.to_s.split.size
  title_key = title.downcase
  description_key = description.downcase
  titles[title_key] << path unless title.empty?
  descriptions[description_key] << path unless description.empty?

  expected_alternates = {
    "en" => row["hreflang_en_url"],
    "es" => row["hreflang_es_url"],
    "x-default" => row["hreflang_x_default_url"]
  }

  issues << ["high", path, "title_mismatch", "expected=#{row['title_tag'].inspect} actual=#{title.inspect}"] if title != row["title_tag"]
  issues << ["high", path, "description_mismatch", "expected=#{row['meta_description'].inspect} actual=#{description.inspect}"] if description != row["meta_description"]
  issues << ["critical", path, "canonical_mismatch", "expected=#{row['canonical_url']} actual=#{canonical}"] if canonical != row["canonical_url"]
  expected_alternates.each do |lang, expected|
    issues << ["critical", path, "hreflang_#{lang}_mismatch", "expected=#{expected} actual=#{alternates[lang]}"] if alternates[lang] != expected
  end
  issues << ["high", path, "h1_count", h1s.size.to_s] unless h1s.size == 1
  issues << ["high", path, "h1_mismatch", "expected=#{row['h1'].inspect} actual=#{h1s.first&.text&.strip.inspect}"] if h1s.size == 1 && h1s.first.text.strip != row["h1"]
  issues << ["medium", path, "title_length", title.length.to_s] unless title.length.between?(30, 65)
  issues << ["medium", path, "description_length", description.length.to_s] unless description.length.between?(110, 165)
  issues << ["high", path, "missing_schema", ""] if schemas.empty?
  minimum_words = row["content_min_words"].to_i
  maximum_words = row["content_max_words"].to_i
  issues << ["advisory", path, "below_content_minimum", "expected>=#{minimum_words} actual=#{word_count}"] if minimum_words.positive? && word_count < minimum_words
  issues << ["advisory", path, "above_content_maximum", "expected<=#{maximum_words} actual=#{word_count}"] if maximum_words.positive? && word_count > maximum_words
  discovered_schema_types = Set.new
  schemas.each_with_index do |schema, index|
    parsed_schema = JSON.parse(schema.text)
    schema_types(parsed_schema, discovered_schema_types)
  rescue JSON::ParserError => error
    issues << ["critical", path, "invalid_schema_#{index + 1}", error.message]
  end
  row["schema_types"].to_s.split("|").map(&:strip).reject(&:empty?).each do |expected_type|
    web_page_types = Set.new(%w[WebPage CollectionPage ContactPage Article])
    satisfied = discovered_schema_types.include?(expected_type)
    satisfied ||= expected_type == "WebPage" && !(discovered_schema_types & web_page_types).empty?
    issues << ["medium", path, "missing_schema_type", expected_type] unless satisfied
  end
  images.each do |image|
    src = image["src"].to_s
    alt = image["alt"]
    issues << ["high", path, "image_missing_alt", src] if alt.nil? || alt.strip.empty?
    next unless src.start_with?("/")
    asset = ROOT.join(src.sub(%r{\A/}, ""))
    issues << ["critical", path, "missing_image", src] unless asset.file?
  end

  doc.css("a[href]").each do |anchor|
    linked_path = normalized_path(anchor["href"])
    next unless linked_path&.start_with?("/")
    next if linked_path.start_with?("/assets/", "/api/")
    target = local_file_for(linked_path)
    issues << ["high", path, "broken_internal_link", anchor["href"]] unless target.file? || linked_path == "/"
  end

  records << {
    path: path,
    pair_id: row["pair_id"],
    language: row["language"],
    title: title,
    description: description,
    canonical: canonical,
    image_count: images.size,
    placeholder_count: images.count { |image| image["src"].to_s.include?("placeholder") },
    word_count: word_count
  }
end

titles.each_value { |paths| issues << ["high", paths.join(" | "), "duplicate_title", ""] if paths.size > 1 }
descriptions.each_value { |paths| issues << ["high", paths.join(" | "), "duplicate_description", ""] if paths.size > 1 }

puts JSON.pretty_generate({
  summary: {
    planned_rows: rows.size,
    planned_pairs: rows.map { |row| row["pair_id"] }.uniq.size,
    audited_pages: records.size,
    issues_by_severity: issues.group_by(&:first).transform_values(&:size),
    pages_with_placeholders: records.count { |record| record[:placeholder_count] > 0 },
    placeholder_slots: records.sum { |record| record[:placeholder_count] }
  },
  issues: issues.map { |severity, path, code, detail| { severity: severity, path: path, code: code, detail: detail } },
  pages: records
})
