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

  // Table helpers -----------------------------------------------------

  function splitTableRow(line) {
    let trimmed = line.trim();
    if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
    if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
    return trimmed.split("|").map((cell) => cell.trim());
  }

  function isTableDelimiterRow(line) {
    const trimmed = line.trim();
    if (!trimmed.includes("-") || !trimmed.includes("|")) return false;
    const cells = splitTableRow(trimmed);
    return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell));
  }

  function alignFromDelimiter(cell) {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    if (left) return "left";
    return "";
  }

function markdownToHtml(md) {
  if (!md) return "";

  // Normalize line endings
  md = md.replace(/\r\n/g, "\n");

  const lines = md.split("\n");
  const html = [];
  let listType = null; // "ul" | "ol" | null
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = "";

  function closeList() {
    if (listType) {
      html.push(listType === "ul" ? "</ul>" : "</ol>");
      listType = null;
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

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

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

    // Horizontal rule (---, ***, ___)
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      closeList();
      html.push("<hr>");
      continue;
    }

    // Tables: a row containing "|" immediately followed by a valid delimiter row
    if (line.includes("|") && i + 1 < lines.length && isTableDelimiterRow(lines[i + 1])) {
      closeList();

      const headerCells = splitTableRow(line);
      const aligns = splitTableRow(lines[i + 1]).map(alignFromDelimiter);
      i += 2; // consume header + delimiter rows

      const bodyRows = [];
      while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|")) {
        bodyRows.push(splitTableRow(lines[i]));
        i++;
      }
      i--; // compensate for the loop's own i++

      html.push("<table>");
      html.push(
        "<thead><tr>" +
          headerCells
            .map((cell, idx) => {
              const style = aligns[idx] ? ` style="text-align:${aligns[idx]}"` : "";
              return `<th${style}>${parseInline(escapeHtml(cell))}</th>`;
            })
            .join("") +
          "</tr></thead>"
      );
      html.push("<tbody>");
      bodyRows.forEach((row) => {
        html.push(
          "<tr>" +
            row
              .map((cell, idx) => {
                const style = aligns[idx] ? ` style="text-align:${aligns[idx]}"` : "";
                return `<td${style}>${parseInline(escapeHtml(cell))}</td>`;
              })
              .join("") +
            "</tr>"
        );
      });
      html.push("</tbody></table>");
      continue;
    }

    // Blockquotes (contiguous "> " lines become one blockquote)
    if (/^>\s?/.test(line)) {
      closeList();
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      i--; // compensate for the loop's own i++

      // Blank quoted lines separate paragraphs within the blockquote
      const paragraphs = [[]];
      quoteLines.forEach((qLine) => {
        if (qLine.trim() === "") {
          paragraphs.push([]);
        } else {
          paragraphs[paragraphs.length - 1].push(qLine);
        }
      });

      html.push(
        "<blockquote>" +
          paragraphs
            .filter((p) => p.length > 0)
            .map((p) => "<p>" + parseInline(escapeHtml(p.join(" "))) + "</p>")
            .join("") +
          "</blockquote>"
      );
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
      if (listType !== "ul") {
        closeList();
        listType = "ul";
        html.push("<ul>");
      }
      const itemText = line.replace(/^\s*[-*]\s+/, "");
      html.push("<li>" + parseInline(escapeHtml(itemText)) + "</li>");
      continue;
    }

    // Ordered lists (1. 2. ...)
    if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== "ol") {
        closeList();
        listType = "ol";
        html.push("<ol>");
      }
      const itemText = line.replace(/^\s*\d+\.\s+/, "");
      html.push("<li>" + parseInline(escapeHtml(itemText)) + "</li>");
      continue;
    }

    closeList();

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

