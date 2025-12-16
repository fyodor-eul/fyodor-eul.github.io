// js/main.js

// List of markdown files (you can add more here)
const BLOG_FILES = [
  { file: "my-rhcsa-cheatsheet.md"},
  { file: "linux-user-mgmt.md"},
  { file: "Understanding_ACL_on_Linux.md"}
];

const PROJECT_FILES = [
  { file: "Unresolved.md"},
  { file: "Lightweight-HTTP-Server.md" },
  { file: "RouteRight.md" }
];

document.addEventListener("DOMContentLoaded", () => {
  initNav();

  const page = document.body.dataset.page;
  if (page === "home") initHome();
  if (page === "blogs") initBlogsPage();
  if (page === "blog-viewer") initBlogViewer();
  if (page === "projects") initProjectsPage();
  if (page === "project-viewer") initProjectViewer();
});

/* ------------------------------------------------------------------ */
/* Navigation / Hamburger                                             */
/* ------------------------------------------------------------------ */

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (!toggle || !navLinks) return;

  toggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    toggle.classList.toggle("open");
  });
}

/* ------------------------------------------------------------------ */
/* Utility: Fetch Markdown & Extract Front-Matter                     */
/* ------------------------------------------------------------------ */

async function fetchMarkdownWithMeta(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error("Failed to load " + path + ": " + response.status);
  }
  const text = await response.text();
  const { meta, content } = extractFrontMatter(text);
  return { meta, content };
}

function extractFrontMatter(markdownText) {
  const lines = markdownText.split("\n");
  const meta = {};
  const contentLines = [];
  let inMeta = true;

  for (let line of lines) {
    if (inMeta && line.trim() === "") {
      inMeta = false;
      continue;
    }
    if (inMeta && line.includes(":")) {
      const idx = line.indexOf(":");
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      meta[key] = value;
    } else {
      inMeta = false;
      contentLines.push(line);
    }
  }

  return { meta, content: contentLines.join("\n").trim() };
}

function makeExcerpt(text, maxLength) {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength - 3) + "...";
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/* ------------------------------------------------------------------ */
/* Home Page                                                          */
/* ------------------------------------------------------------------ */

function initHome() {
  // Typing effect
  const titleEl = document.getElementById("typing-title");
  const subtitleEl = document.getElementById("typing-subtitle");
  const titleText = "Hello, I'm Fyodor";
  const subtitleText = "Linux · Networking · Device Drivers";

  typeSequence([
    { element: titleEl, text: titleText, speed: 70 },
    { element: subtitleEl, text: subtitleText, speed: 40 }
  ]);

  // Load previews
  loadProjectPreview();
  loadBlogPreview();
}

function typeSequence(steps) {
  let stepIndex = 0;

  function typeNext() {
    if (stepIndex >= steps.length) return;
    const { element, text, speed } = steps[stepIndex];
    if (!element) {
      stepIndex++;
      typeNext();
      return;
    }
    element.textContent = "";
    let i = 0;
    const interval = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        stepIndex++;
        setTimeout(typeNext, 200);
      }
    }, speed);
  }

  typeNext();
}

async function loadProjectPreview() {
  const container = document.getElementById("project-preview-list");
  if (!container) return;

  const items = PROJECT_FILES.slice(0, 4);   // Edit
  for (const item of items) {
    try {
      const { meta, content } = await fetchMarkdownWithMeta("projects/" + item.file);
      const card = document.createElement("div");
      card.className = "card";
      card.addEventListener("click", () => {
        window.location.href = "project-viewer.html?file=" + encodeURIComponent(item.file);
      });

      const thumb = document.createElement("div");
      thumb.className = "card-thumb";
      if (meta.image) {
        const img = document.createElement("img");
        img.src = meta.image;
        thumb.appendChild(img);
      } else {
        thumb.appendChild(createAsciiPlaceholder("[ PROJECT ]"));
      }

      const body = document.createElement("div");
      body.className = "card-body";
      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = meta.title || item.file;
      const text = document.createElement("p");
      text.className = "card-text";
      const base = meta.description || content;
      text.textContent = makeExcerpt(base, 120);

      body.appendChild(title);
      body.appendChild(text);

      card.appendChild(thumb);
      card.appendChild(body);

      container.appendChild(card);
    } catch (err) {
      // fail quietly
      console.error(err);
    }
  }
}

async function loadBlogPreview() {
  const container = document.getElementById("blog-preview-list");
  if (!container) return;

  const items = BLOG_FILES.slice(0, 3);
  for (const item of items) {
    try {
      const { meta, content } = await fetchMarkdownWithMeta("blogs/" + item.file);
      const row = document.createElement("div");
      row.className = "playlist-item";
      row.addEventListener("click", () => {
        window.location.href = "blog-viewer.html?file=" + encodeURIComponent(item.file);
      });

      const thumb = document.createElement("div");
      thumb.className = "playlist-thumb";
      if (meta.image) {
        const img = document.createElement("img");
        img.src = meta.image;
        thumb.appendChild(img);
      } else {
        thumb.appendChild(createAsciiPlaceholder("[ BLOG ]"));
      }

      const body = document.createElement("div");
      body.className = "playlist-body";
      const title = document.createElement("h3");
      title.className = "playlist-title";
      title.textContent = meta.title || item.file;
      const excerpt = document.createElement("p");
      excerpt.className = "playlist-excerpt";
      const base = meta.description || content;
      excerpt.textContent = makeExcerpt(base, 140);

      body.appendChild(title);
      body.appendChild(excerpt);

      row.appendChild(thumb);
      row.appendChild(body);

      container.appendChild(row);
    } catch (err) {
      console.error(err);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Blogs Page                                                         */
/* ------------------------------------------------------------------ */

async function initBlogsPage() {
  const listEl = document.getElementById("blogs-list");
  if (!listEl) return;

  for (const blog of BLOG_FILES) {
    try {
      const { meta, content } = await fetchMarkdownWithMeta("blogs/" + blog.file);

      const item = document.createElement("div");
      item.className = "playlist-item";
      item.addEventListener("click", () => {
        window.location.href = "blog-viewer.html?file=" + encodeURIComponent(blog.file);
      });

      const thumb = document.createElement("div");
      thumb.className = "playlist-thumb";
      if (meta.image) {
        const img = document.createElement("img");
        img.src = meta.image;
        thumb.appendChild(img);
      } else {
        thumb.appendChild(createAsciiPlaceholder("[ BLOG ]"));
      }

      const body = document.createElement("div");
      body.className = "playlist-body";
      const title = document.createElement("h3");
      title.className = "playlist-title";
      title.textContent = meta.title || blog.file;
      const excerpt = document.createElement("p");
      excerpt.className = "playlist-excerpt";
      const base = meta.description || content;
      excerpt.textContent = makeExcerpt(base, 180);

      body.appendChild(title);
      body.appendChild(excerpt);
      item.appendChild(thumb);
      item.appendChild(body);

      listEl.appendChild(item);
    } catch (err) {
      console.error(err);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Blog Viewer                                                        */
/* ------------------------------------------------------------------ */
async function initBlogViewer() {
  const file = getQueryParam("file");
  const container = document.getElementById("blog-content");
  const titleBar = document.getElementById("blog-terminal-title");

  if (!file || !container) {
    if (container) container.textContent = "No blog file specified.";
    return;
  }

  try {
    const { meta, content } = await fetchMarkdownWithMeta("blogs/" + file);
    if (titleBar) {
      titleBar.textContent = "cat blogs/" + file;
    }

    // 🆕 Notion-style cover
    if (meta.cover) {
      const body = container.parentElement;         // .terminal-body
      const coverEl = document.createElement("div");
      coverEl.className = "blog-cover";
      coverEl.style.backgroundImage = `url('${meta.cover}')`;

      // Insert cover ABOVE the article content
      body.insertBefore(coverEl, container);
    }

    const html = window.markdownToHtml(content);
    container.innerHTML = `
      <h1>${meta.title || file}</h1>
      ${meta.description ? `<p><em>${meta.description}</em></p>` : ""}
      ${html}
    `;

    // Highlight code blocks if highlight.js is available
    if (window.hljs) {
      container.querySelectorAll("pre code").forEach((block) => {
        window.hljs.highlightElement(block);
      });
    }

  } catch (err) {
    console.error(err);
    container.textContent = "Failed to load blog: " + err.message;
  }
}

/* ------------------------------------------------------------------ */
/* Projects Page                                                      */
/* ------------------------------------------------------------------ */

async function initProjectsPage() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  for (const proj of PROJECT_FILES) {
    try {
      const { meta, content } = await fetchMarkdownWithMeta("projects/" + proj.file);

      const card = document.createElement("div");
      card.className = "project-card";
      card.addEventListener("click", () => {
        window.location.href = "project-viewer.html?file=" + encodeURIComponent(proj.file);
      });

      const thumb = document.createElement("div");
      thumb.className = "project-thumb";
      if (meta.image) {
        const img = document.createElement("img");
        img.src = meta.image;
        thumb.appendChild(img);
      } else {
        thumb.appendChild(createAsciiPlaceholder("[ PROJECT ]"));
      }

      const metaDiv = document.createElement("div");
      metaDiv.className = "project-meta";

      const titleEl = document.createElement("h3");
      titleEl.className = "project-title";
      titleEl.textContent = meta.title || proj.file;

      const descEl = document.createElement("p");
      descEl.className = "project-desc";
      const base = meta.description || content;
      descEl.textContent = makeExcerpt(base, 160);

      metaDiv.appendChild(titleEl);
      metaDiv.appendChild(descEl);

      if (meta.link) {
        const linkEl = document.createElement("a");
        linkEl.className = "project-link";
        linkEl.href = meta.link;
        linkEl.target = "_blank";
        linkEl.rel = "noopener noreferrer";
        linkEl.textContent = "View repository";
        metaDiv.appendChild(linkEl);
      }

      card.appendChild(thumb);
      card.appendChild(metaDiv);

      grid.appendChild(card);
    } catch (err) {
      console.error(err);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Project Viewer                                                     */
/* ------------------------------------------------------------------ */

async function initProjectViewer() {
  const file = getQueryParam("file");
  const container = document.getElementById("project-content");
  const titleBar = document.getElementById("project-terminal-title");

  if (!file || !container) {
    if (container) container.textContent = "No project file specified.";
    return;
  }

  try {
    const { meta, content } = await fetchMarkdownWithMeta("projects/" + file);
    if (titleBar) {
      titleBar.textContent = "cat projects/" + file;
    }
    const html = window.markdownToHtml(content);
    container.innerHTML = `
      <h1>${meta.title || file}</h1>
      ${meta.description ? `<p><em>${meta.description}</em></p>` : ""}
      ${meta.link ? `<p><a href="${meta.link}" target="_blank" rel="noopener noreferrer">Repository link</a></p>` : ""}
      ${html}
    `;
    if (window.hljs) {
      container.querySelectorAll("pre code").forEach((block) => {
        window.hljs.highlightElement(block);
      });
    }

  } catch (err) {
    console.error(err);
    container.textContent = "Failed to load project: " + err.message;
  }
}

/* ------------------------------------------------------------------ */
/* ASCII Placeholder helper                                           */
/* ------------------------------------------------------------------ */

function createAsciiPlaceholder(label) {
  const wrap = document.createElement("div");
  wrap.className = "placeholder-thumb";
  const pre = document.createElement("pre");
  pre.textContent = label;
  wrap.appendChild(pre);
  return wrap;
}

