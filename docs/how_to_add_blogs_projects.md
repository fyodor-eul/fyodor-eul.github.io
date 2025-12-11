# How to Add New Blogs and Projects

This guide explains how to add more **Blogs** and **Projects** to your terminal-style website.

---

## 📌 Adding a New Blog

### 1. Create a Markdown file  
Add a new `.md` file inside the `/blogs/` folder:

```
/blogs/
   blog3.md
```

### 2. Add front‑matter to the top of the file  
Example:

```
title: My New Blog
image: images/blog3-thumb.png
description: A short preview text for this blog.
```

- `title:` → shown in previews and viewer  
- `image:` → thumbnail in blog list (optional)  
- `description:` → excerpt for previews  

### 3. Write your blog content  
Use normal Markdown:

```
# My New Blog

This is my blog content...

![Example Image](images/example.png)

'''bash
echo "Hello"
'''
```

### 4. Add the Markdown file name to `BLOG_FILES`  
Open `/js/main.js` → find:

```javascript
const BLOG_FILES = [
  { file: "blog1.md" },
  { file: "blog2.md" }
];
```

Add your new file:

```javascript
{ file: "blog3.md" }
```

### 5. Add image files (optional)
Put your thumbnails or blog images in:

```
/images/
```

---

## 📦 Adding a New Project

### 1. Create a new `.md` file in `/projects/`

```
/projects/
   project3.md
```

### 2. Add front‑matter

```
title: My New Project
image: images/project3-thumb.png
description: Short description for preview.
link: https://github.com/your/repository   (optional)
```

### 3. Add your project content

```
# My New Project

A description of the project...

![Screenshot](images/project3.png)

```

### 4. Add the file to `PROJECT_FILES` in `main.js`

In `/js/main.js`:

```javascript
const PROJECT_FILES = [
  { file: "project1.md" },
  { file: "project2.md" }
];
```

Add:

```javascript
{ file: "project3.md" }
```

### 5. Add thumbnail and images  
Place your images in:

```
/images/
```

---

## ⚠️ Important Notes

- Always load the website using a **local server**, not `file://`
  - Example:
    ```
    python -m http.server
    ```
- All image paths should be:
  ```
  images/your-image.png
  ```
- Missing thumbnail images will automatically show the ASCII placeholder.

---

## 🎉 Done!  
Now your new blog or project will appear in:
- Home page previews  
- `~/blogs` or `~/projects` pages  
- Dedicated viewer pages  

Keep this file for future reference!
