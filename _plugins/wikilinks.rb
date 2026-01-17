# Wikilinks preprocessor for Obsidian-style [[links]]
# Converts [[Note Title]] to [Note Title](/note-title/)
# Converts [[Note Title|Display Text]] to [Display Text](/note-title/)

Jekyll::Hooks.register [:pages, :documents], :pre_render do |item|
  # Convert [[wikilinks]] to [markdown](links)
  item.content = item.content.gsub(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/) do
    title = $1.strip
    display = $2 ? $2.strip : title
    slug = title.downcase.gsub(/\s+/, '-').gsub(/[^\w-]/, '')
    "[#{display}](/#{slug}/)"
  end
end
