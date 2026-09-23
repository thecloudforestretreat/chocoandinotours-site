#!/usr/bin/env ruby

require "csv"
require "cgi"
require "pathname"

root = Pathname.new(__dir__).join("..").expand_path
plan = root.join("planning/chocoandinotours-page-plan-2026-09-22.csv")
output = root.join("sitemap.xml")
lastmod = ENV.fetch("SITEMAP_LASTMOD", Time.now.strftime("%Y-%m-%d"))
rows = CSV.read(plan, headers: true).select { |row| row["sitemap_include"] == "yes" }

lines = [
  %(<?xml version="1.0" encoding="UTF-8"?>),
  %(<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">)
]

rows.each do |row|
  lines << "  <url>"
  lines << "    <loc>#{CGI.escapeHTML(row['page_url'])}</loc>"
  lines << %(    <xhtml:link rel="alternate" hreflang="en" href="#{CGI.escapeHTML(row['hreflang_en_url'])}" />)
  lines << %(    <xhtml:link rel="alternate" hreflang="es" href="#{CGI.escapeHTML(row['hreflang_es_url'])}" />)
  lines << %(    <xhtml:link rel="alternate" hreflang="x-default" href="#{CGI.escapeHTML(row['hreflang_x_default_url'])}" />)
  lines << "    <lastmod>#{lastmod}</lastmod>"
  lines << "    <changefreq>#{row['sitemap_changefreq']}</changefreq>"
  lines << "    <priority>#{row['sitemap_priority']}</priority>"
  lines << "  </url>"
end

lines << "</urlset>"
output.write(lines.join("\n") + "\n")
puts "Wrote #{rows.size} URLs to #{output.relative_path_from(root)}"
