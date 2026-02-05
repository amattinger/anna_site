# 🏺 Clay Theme for Astro

[![Netlify Status](https://api.netlify.com/api/v1/badges/098d9ba5-fd1a-4c6b-83c1-0b70fd7e017c/deploy-status)](https://app.netlify.com/projects/clay-astro-theme/deploys)
[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-orange?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A minimalist, image-centric theme for photographers and artists. Originally a Gatsby theme, now fully ported to **Astro** for superior performance and modern development experience.

> **Note**: This theme is a modern Astro port of the beautiful [Clay Theme](https://github.com/lilxyzz/clay-theme) by `lilxyzz`.

<p align="center">
  <img src="public/img/clay_astro_light.png" width="48%" alt="Light Mode" style="border-radius: 10px; border: 1px solid #ddd;">
  <img src="public/img/clay_astro_dark.png" width="48%" alt="Dark Mode" style="border-radius: 10px; border: 1px solid #333;">
</p>

📺 Check out the [Live Demo](https://clay-astro-theme.netlify.app) or view on the [Astro Themes Portal](https://astro.build/themes/details/clay/)

---

## ✨ Features

- ⚡ **Astro-Powered** - Blazing fast static site generation with zero-JS output by default
- 🎨 **Beautiful Design** - Minimalist and image-centric layout perfect for portfolios
- 🔄 **Client Router** - Seamless client-side navigation for an SPA-like feel
- 📱 **Responsive Design** - Mobile-friendly layout with a collapsible menu
- 🌗 **Dark Mode** - Native dark mode support with toggle switch and persistence
- 📝 **CMS Ready** - Pre-configured with **Decap CMS** (formerly Netlify CMS)
- 🎯 **Scoped CSS** - Modular, component-scoped styles replacing legacy monolithic CSS
- ✍️ **Typography** - Futura for titles/menu (Small Caps) and EB Garamond for body
- 📚 **Content Collections** - Type-safe Markdown content management

---

## 🚀 Getting Started

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/clay-astro-theme.git
cd clay-astro-theme

# Install dependencies and start dev server
npm install && npm run dev
```

Visit `http://localhost:4321` to see your site in action! 🎉

### Detailed Installation

If you prefer a step-by-step approach:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```
    The output will be in the `dist/` directory, ready for deployment.

---

## 🛠️ Tech Stack

- **[Astro](https://astro.build)** - Static Site Generator
- **[React](https://react.dev)** - UI Library
- **[Decap CMS](https://decapcms.org/)** - Headless CMS
- **[PostCSS](https://postcss.org/)** - CSS Processing
- **TypeScript** - Type Safety
- **Markdown/MDX** - Content Management

### Key Dependencies

- **Core**: `astro`, `react`, `react-dom`
- **Integrations**: `@astrojs/react`, `@astrojs/sitemap`
- **Styling**: `postcss`, `autoprefixer`
  - Plugins: `postcss-color-function`, `postcss-custom-properties`, `postcss-easy-import`

---

## 📁 Project Structure

```text
/
├── public/                 # Static assets (images, admin config)
│   ├── admin/              # Decap CMS configuration
│   └── img/                # Uploaded images
├── src/
│   ├── components/         # Reusable Astro components (PostCard, etc.)
│   ├── content/            # Content Collections (Markdown/MDX)
│   │   ├── news/           # News/blog posts
│   │   ├── pages/          # Static pages
│   │   ├── sold/           # Sold items (for artists)
│   │   └── work/           # Portfolio work items
│   ├── layouts/            # Main layouts (Layout.astro)
│   ├── pages/              # Route definitions
│   │   ├── index.astro     # Home page
│   │   ├── [...slug].astro # Dynamic route for generic pages
│   │   └── work/[slug].astro # Dynamic routes for collections
│   ├── styles/             # Global variables and resets
│   │   ├── content.css     # Typography for markdown content
│   │   └── vars.css        # CSS Variables (Colors, Fonts)
│   └── templates/          # Templates for different content types
├── astro.config.mjs        # Astro configuration
├── postcss.config.cjs      # PostCSS configuration
└── tsconfig.json           # TypeScript configuration
```

---

## 🎨 Customization

### Fonts & Colors

Edit `src/styles/vars.css` to update CSS variables for colors, fonts, and breakpoints:

```css
:root {
  --color-primary: #3eb0ef;
  --color-base: #131313;
  --font-serif: 'EB Garamond', Georgia, Times, serif;
  /* ... more variables */
}
```

### Content Management

- **Option 1**: Add markdown files directly to `src/content/` folders
- **Option 2**: Use the Admin panel at `/admin` (requires local backend or Netlify deployment)

### Bio (and other pages) not updating in the CMS preview?

1. Run the dev server: `npm run dev`.
2. Open the CMS at **http://localhost:4321/admin** (same origin as the site).
3. Edit Bio (or any page) and save. The preview iframe will show your local site; refresh the preview (e.g. Cmd+Shift+R) if it doesn’t update.
4. If you use the admin on a different URL (e.g. production), the preview will load that URL, so you won’t see local edits until you deploy.

### Live site (e.g. annamattinger.com) not showing Bio or other page updates?

The live site can show old content when the CDN or browser has cached the page.

1. **Hard-refresh the page**: On the Bio page, use **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux) to bypass browser cache.
2. **Clear Netlify cache and redeploy**: In the [Netlify dashboard](https://app.netlify.com) → your site → **Deploys** → **Trigger deploy** → **Clear cache and deploy site**. That rebuilds and serves the latest content.
3. **Next time**: The repo includes `netlify.toml` with cache headers so HTML (including `/bio`) is revalidated; after you deploy that file, future content updates should appear without a full cache clear.

### Images and renaming

Images live in `public/img/`. Content (markdown frontmatter and body) references them by path, e.g. `/img/clay-image-1.jpg`.

- **If you rename or move a file in `public/img/`**, update every reference to the old path in:
  - `src/content/pages/*.md` (frontmatter: `thumbnail`, `featuredimage`, `image`; body: `![alt](/img/...)`)
  - `src/content/news/*.md`, `src/content/work/*.md`, `src/content/sold/*.md`
- **To find references**: search for the old filename (e.g. `clay-image-1.jpg`) across `src/content` and update to the new path.
- **Case matters** on Linux and many hosts: `Photo.jpg` and `photo.jpg` are different. Keep paths exactly matching the file name.

### Photography-all and the Work page

The **Work** page is built from `src/content/work/*.md` and images in **`public/img/`**. The `photography-all/` folder (images and markdown) is **not** used by the site at build time.

- Renaming or adding files in `photography-all/images/` does **not** change the Work page until you update the site’s content and assets.
- To keep Work in sync when you rename in photography-all: (1) copy the renamed file into `public/img/` with the new name, (2) update the `thumbnail` (and any image paths) in the corresponding `src/content/work/*.md` file to the new path (e.g. `/img/NewFilename.jpg`). Match by which work entry should show that image.
- If you use a script to generate Work content from photography-all, have it use a stable identifier (e.g. slug or list order), not the image filename, so renaming the file doesn’t break the link between content and image.

### Navigation

Edit the `<nav>` section in `src/layouts/Layout.astro` to customize menu links.

---

## 🚀 Deployment

### Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

### Deploy to Vercel

```bash
npm run build
# Upload dist/ folder to Vercel
```

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Credits

- **Original Theme**: [Clay Theme](https://github.com/lilxyzz/clay-theme) by `lilxyzz`
- **Framework**: [Astro](https://astro.build)
- **CMS**: [Decap CMS](https://decapcms.org/)



<p align="center">Made with ❤️ using Astro</p>
