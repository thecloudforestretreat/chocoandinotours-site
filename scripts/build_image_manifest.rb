#!/usr/bin/env ruby

require "csv"
require "nokogiri"
require "pathname"

root = Pathname.new(__dir__).join("..").expand_path
plan = CSV.read(root.join("planning/chocoandinotours-page-plan-2026-09-22.csv"), headers: true)
output = root.join("docs/chocoandinotours-image-replacement-manifest.csv")
full_output = root.join("docs/chocoandinotours-full-image-shot-list.csv")

def file_for(root, path)
  clean = path.sub(%r{\A/}, "")
  clean.empty? ? root.join("index.html") : root.join(clean, "index.html")
end

def role_for(image)
  node = image
  while node
    classes = node["class"].to_s.split
    return "hero" if (classes & %w[hubFigure homeHeroFigure bookingHeroFigure]).any?
    return "content_card" if (classes & %w[routeCard homeCard]).any?
    node = node.parent
  end
  "content_image"
end

english_rows = plan.select { |row| row["language"] == "en" }
manifest = []
full_manifest = []

english_rows.each do |row|
  english_doc = Nokogiri::HTML(file_for(root, row["page_path"]).read)
  spanish_row = plan.find { |candidate| candidate["pair_id"] == row["pair_id"] && candidate["language"] == "es" }
  spanish_doc = Nokogiri::HTML(file_for(root, spanish_row["page_path"]).read)
  english_images = english_doc.css("main img")
  spanish_images = spanish_doc.css("main img")
  card_index = 0

  english_images.each_with_index do |image, index|
    source = image["src"].to_s
    role = role_for(image)
    card_index += 1 unless role == "hero"
    dimensions = role == "hero" ? "1800x1350 minimum" : "1600x900 minimum"
    crop = role == "hero" ? "4:3 source; keep subject inside center square safe area" : "16:9 landscape; keep subject away from edges"
    suffix = role == "hero" ? "hero" : format("card-%02d", card_index)
    record = {
      "priority" => row["priority"],
      "pair_id" => row["pair_id"],
      "english_page" => row["page_path"],
      "spanish_page" => spanish_row["page_path"],
      "page_name" => row["page_name"],
      "placement" => role,
      "current_asset" => source,
      "requested_filename" => "assets/images/pages/replacements/#{row['pair_id'].downcase}-#{suffix}.jpg",
      "shot_brief_en" => image["alt"].to_s.strip,
      "shot_brief_es" => spanish_images[index]&.[]("alt").to_s.strip,
      "recommended_dimensions" => dimensions,
      "crop_guidance" => crop,
      "delivery_format" => "High-quality JPG, TIFF or PNG original; site copy will be optimized to WebP",
      "target_web_weight" => role == "hero" ? "400 KB or less" : "250 KB or less",
      "rights_requirement" => "Owned or licensed for commercial web use; identifiable people require permission",
      "status" => source.include?("placeholder") ? "replace_now_placeholder" : "replace_for_unique_page_imagery"
    }
    full_manifest << record
    manifest << record if source.include?("placeholder")
  end
end

CSV.open(output, "w", write_headers: true, headers: manifest.first.keys) do |csv|
  manifest.each { |row| csv << row }
end
CSV.open(full_output, "w", write_headers: true, headers: full_manifest.first.keys) do |csv|
  full_manifest.each { |row| csv << row }
end

puts "Wrote #{manifest.size} bilingual replacement slots to #{output.relative_path_from(root)}"
puts "Wrote #{full_manifest.size} total bilingual image slots to #{full_output.relative_path_from(root)}"
