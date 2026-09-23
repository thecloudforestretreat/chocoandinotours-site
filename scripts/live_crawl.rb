#!/usr/bin/env ruby

require "csv"
require "net/http"
require "nokogiri"
require "pathname"
require "thread"
require "uri"

root = Pathname.new(__dir__).join("..").expand_path
origin = ARGV.fetch(0, "https://staging.chocoandinotours.com").sub(%r{/+\z}, "")
rows = CSV.read(root.join("planning/chocoandinotours-page-plan-2026-09-22.csv"), headers: true)
queue = Queue.new
rows.each { |row| queue << row }
results = []
mutex = Mutex.new

workers = 8.times.map do
  Thread.new do
    loop do
      row = queue.pop(true)
      uri = URI("#{origin}#{row['page_path']}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.open_timeout = 10
      http.read_timeout = 15
      response = http.get(uri.request_uri, { "User-Agent" => "ChocoAndinoToursProductionAudit/1.0" })
      doc = Nokogiri::HTML(response.body)
      canonical = doc.at_css('link[rel="canonical"]')&.[]("href")
      alternates = doc.css('link[rel="alternate"][hreflang]').to_h { |node| [node["hreflang"], node["href"]] }
      result = {
        path: row["page_path"],
        status: response.code.to_i,
        robots_header: response["x-robots-tag"],
        canonical_ok: canonical == row["canonical_url"],
        hreflang_ok: alternates["en"] == row["hreflang_en_url"] && alternates["es"] == row["hreflang_es_url"] && alternates["x-default"] == row["hreflang_x_default_url"],
        h1_count: doc.css("h1").size,
        missing_image_dimensions: doc.css("main img").count { |image| image["width"].to_s.empty? || image["height"].to_s.empty? }
      }
      mutex.synchronize { results << result }
    rescue ThreadError
      break
    rescue StandardError => error
      mutex.synchronize { results << { path: row && row["page_path"], error: "#{error.class}: #{error.message}" } }
    end
  end
end
workers.each(&:join)

results.sort_by! { |result| result[:path].to_s }
failures = results.reject do |result|
  result[:status] == 200 && result[:canonical_ok] && result[:hreflang_ok] && result[:h1_count] == 1 && result[:missing_image_dimensions] == 0 &&
    (origin.include?("staging.") ? result[:robots_header].to_s.include?("noindex") : true)
end

puts "origin=#{origin}"
puts "pages=#{results.size} failures=#{failures.size}"
failures.each { |failure| puts failure.inspect }
exit(failures.empty? ? 0 : 1)
