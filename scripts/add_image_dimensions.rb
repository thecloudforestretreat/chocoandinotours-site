#!/usr/bin/env ruby

require "csv"
require "pathname"

root = Pathname.new(__dir__).join("..").expand_path
plan = CSV.read(root.join("planning/chocoandinotours-page-plan-2026-09-22.csv"), headers: true)
dimensions = {
  "/assets/cat_park_page_02.jpg" => [3840, 2160],
  "/assets/cta_park_page_03.jpg" => [2800, 1400],
  "/cta_park_page_03.jpg" => [2800, 1400],
  "/assets/images/pages/home/cacao-pod.jpg" => [1920, 1080],
  "/assets/images/pages/home/cacao-processing.jpg" => [1080, 1920],
  "/assets/images/pages/home/coffee-cherries.jpg" => [1920, 1080],
  "/assets/images/pages/placeholders/placeholder-clouds.jpg" => [3024, 4032],
  "/assets/images/pages/placeholders/placeholder-gallery.jpg" => [3024, 4032],
  "/assets/images/pages/placeholders/placeholder-hero.jpg" => [4032, 3024],
  "/assets/images/pages/placeholders/placeholder-tour.jpg" => [3024, 4032]
}

def file_for(root, path)
  clean = path.sub(%r{\A/}, "")
  clean.empty? ? root.join("index.html") : root.join(clean, "index.html")
end

updated_files = 0
updated_images = 0
plan.each do |row|
  file = file_for(root, row["page_path"])
  source = file.read
  updated = source.gsub(/<img\b[^>]*>/) do |tag|
    src = tag[/\bsrc="([^"]+)"/, 1]
    size = dimensions[src]
    next tag unless size
    next tag if tag.match?(/\bwidth="/) && tag.match?(/\bheight="/)
    updated_images += 1
    tag.sub(/>\z/, %( width="#{size[0]}" height="#{size[1]}">))
  end
  next if updated == source
  file.write(updated)
  updated_files += 1
end

puts "Added dimensions to #{updated_images} images across #{updated_files} files"
