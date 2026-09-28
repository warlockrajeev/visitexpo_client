/**
 * @file textFormatters.js
 * @description Centralized rich description cleaning, formatting, and markdown parsing utilities.
 * Ensures consistent rendering of event descriptions across cards, directories, and previews
 * without raw hashtags (##, ###) or dangling markdown symbols leaking into the UI.
 */

/**
 * Strips all HTML tags, HTML entities, and Markdown symbols (**, *, #, `)
 * returning pure, readable plain text.
 */
export function stripMarkdownAndHtml(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    // Normalize multi-hashtags inside bold
    .replace(/\*\*\s*#{1,6}\s*([\s\S]*?)\*\*/g, '$1')
    // Remove bold asterisks
    .replace(/\*\*\s*([^*]+?)\s*\*\*/g, '$1')
    // Remove italic asterisks
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '$1')
    // Remove leading and stray hashtags
    .replace(/#{1,6}\s*/g, '')
    // Remove dangling asterisks
    .replace(/\*{2,}/g, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Remove common HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formats rich description text for compact card previews.
 * Preserves bold styling (<strong>) for headings/highlights while cleaning all raw markdown syntax
 * like hashtags (##, ###), chained headers, and block tags so the snippet fits neatly in clamped cards.
 */
export function renderCardDescription(content) {
  if (!content || typeof content !== 'string') return 'No description provided.';

  let text = content;

  // 1. Normalize headings and paragraph line breaks into bold/inline elements
  text = text
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '<strong>$1</strong> ')
    .replace(/<br\s*[\/]?>/gi, ' ')
    .replace(/<\/p>/gi, ' </p>');

  // 2. Clean multi-hashtag patterns like **### Title** -> **Title**
  text = text.replace(/\*\*\s*#{1,6}\s*([\s\S]*?)\*\*/g, '**$1**');

  // Replace lines or headings starting with ### or ## or # with bold styling
  text = text.replace(/(?:^|\n)\s*#{1,6}\s*(?:#{1,6}\s*)*(.*?)(?=\n|$)/g, ' **$1** ');

  // Clean any remaining stray hashtags (e.g., "Toronto, ### Canada" -> "Toronto, Canada")
  text = text.replace(/#{1,6}\s*/g, '');

  // 3. Format inline markdown
  // **bold** -> <strong>bold</strong>
  text = text.replace(/\*\*\s*([^*]+?)\s*\*\*/g, '<strong>$1</strong>');
  // *italic* -> <em>italic</em>
  text = text.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
  // Clean dangling asterisks
  text = text.replace(/\*{2,}/g, '');

  // 4. Strip any non-inline HTML tags (keep only styling tags: strong, b, em, i, u, span)
  text = text.replace(/<(?!\/?(?:strong|b|em|i|u|span)\b)[^>]+>/gi, ' ');

  // 5. Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // 6. Collapse extra whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text || 'No description provided.';
}
