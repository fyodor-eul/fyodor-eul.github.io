// js/markdown.js
// Minimal Markdown-to-HTML parser for this portfolio.
// Exposes a single global function: markdownToHtml(mdString)

(function () {
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function parseInline(text) {
    // Images ![alt](src)
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');

    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Bold **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // Italic *text*
    text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Inline code `code`
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

    return text;
  }

function markdownToHtml(md) {
  if (!md) return "";

  // Normalize line endings
  md = md.replace(/\r\n/g, "\n");

  const lines = md.split("\n");
  const html = [];
  let inList = false;
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = "";

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  function closeCodeBlock() {
    if (inCodeBlock) {
      const classAttr = codeLang ? ` class="language-${codeLang}"` : "";
      html.push(
        "<pre><code" +
          classAttr +
          ">" +
          escapeHtml(codeBuffer.join("\n")) +
          "</code></pre>"
      );
      codeBuffer = [];
      codeLang = "";
      inCodeBlock = false;
    }
  }

  for (let rawLine of lines) {
    let line = rawLine;

    // Code fences ```lang
    if (line.trim().startsWith("```")) {
      const fenceMatch = line.trim().match(/^```([\w+-]+)?/);
      if (inCodeBlock) {
        // closing
        closeCodeBlock();
      } else {
        // opening
        inCodeBlock = true;
        codeBuffer = [];
        codeLang = fenceMatch && fenceMatch[1] ? fenceMatch[1].toLowerCase() : "";
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      // blank line
      closeList();
      html.push("");
      continue;
    }

    // Headings
    if (/^###\s+/.test(line)) {
      closeList();
      const text = line.replace(/^###\s+/, "");
      html.push("<h3>" + parseInline(escapeHtml(text)) + "</h3>");
      continue;
    }
    if (/^##\s+/.test(line)) {
      closeList();
      const text = line.replace(/^##\s+/, "");
      html.push("<h2>" + parseInline(escapeHtml(text)) + "</h2>");
      continue;
    }
    if (/^#\s+/.test(line)) {
      closeList();
      const text = line.replace(/^#\s+/, "");
      html.push("<h1>" + parseInline(escapeHtml(text)) + "</h1>");
      continue;
    }

    // Unordered lists (- or *)
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) {
        inList = true;
        html.push("<ul>");
      }
      const itemText = line.replace(/^\s*[-*]\s+/, "");
      html.push("<li>" + parseInline(escapeHtml(itemText)) + "</li>");
      continue;
    } else {
      closeList();
    }

    // Default: paragraph
    html.push("<p>" + parseInline(escapeHtml(line)) + "</p>");
  }

  closeList();
  closeCodeBlock();

  return html.join("\n");
}

  // Expose globally
  window.markdownToHtml = markdownToHtml;
})();

