# The Architect's Journal — douglasmitchell.info blog

A fully self-contained, zero-dependency personal blog for **Douglas Mitchell** — immersive, editorial-noir, and interactive. One `index.html` file. No build step, no npm install, no framework. Open it and it runs.

## Features

- **Immersive hero** — interactive "signal field" particle canvas that reacts to your cursor, staggered editorial typography, animated proof-of-work counters
- **The Journal** — blog with live tag filters, archive search, and a distraction-free article reader with reading progress, shareable links (`#read/slug`), and markdown-lite rendering
- **The Screening Room** — cinematic video section with custom play overlay and signal chapters; visitors watch *you*
- **AI Console (chatbot)** — a "public knowledge console" widget with an intent-matching engine trained on your public work: book, projects, credentials, philosophy, contact. Refuses private-info requests, confidence-aware fallbacks, suggested prompts
- **Admin portal** — hidden operator console (`Ctrl+Shift+A`, footer link, or `#admin`): authenticate, then manage everything
  - **Overview** — publish stats, drafts, console usage, visits
  - **Posts** — full CRUD: create, edit, publish/unpublish, two-step delete. Locally created posts appear live on the public Journal
  - **Media** — swap the Screening Room video (URL + poster + title) without touching code
  - **Settings** — change admin credentials and the console greeting
- **Extras** — boot sequence overlay, custom cursor with magnetic buttons, scroll-spy nav, marquee, light/dark theme, toasts, `prefers-reduced-motion` support, fully responsive

## Quick start

Double-click `index.html`. That's it.

To serve locally (recommended for testing hash routes):

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

## Admin portal

| | |
|---|---|
| Access | `Ctrl+Shift+A`, footer "◇ Admin", or append `#admin` to the URL |
| Default credentials | `admin` / `architect-2026` |
| Session | 30 minutes, browser session |

Change credentials immediately in **Admin → Settings**. ⚠️ **Honest note:** this is a client-side demo gate — fine for a personal site, not real security. For production auth, put a backend in front (Next.js + Auth.js, Clerk, or Supabase) or keep truly sensitive ops server-side.

## Customization map

Everything you'd want to change lives in the `SITE_CONFIG` block at the top of the `<script>` in `index.html`:

- `email`, `github`, `linkedin` — contact links
- `adminUser` / `adminPass` — default admin credentials
- `video.src` / `video.poster` / `video.title` — Screening Room defaults (set live via Admin → Media)
- `consoleGreeting` — first message the AI console shows

Other edit points:

- **Seed posts** — the `SEED_POSTS` array. Each post: `slug`, `title`, `date`, `read` (minutes), `tags`, `accent` (`gold|teal|rose|violet`), `status`, `excerpt`, and `body` written in markdown-lite (`## H2`, `### H3`, `**bold**`, `*italic*`, `` `code` ``, `- bullets`, `> quotes`)
- **Case studies / personas / credentials** — hardcoded in the HTML sections (`#proof`, `#philosophy`, `#credentials`)
- **Console knowledge base** — the `KB` array; add topics by appending `{id, keys:[...], reply:()=> "..."}` entries
- **Video hosting** — any direct MP4 URL (GitHub raw file, Cloudflare R2, S3, Mux, Bunny). Keep files < ~50MB for raw hosting; use a streaming platform for anything feature-length

Admin-created posts and settings persist in `localStorage` (per-browser). To ship them for *all* visitors, move them into `SEED_POSTS` / `SITE_CONFIG` in the file itself.

## Deploying

- **GitHub Pages** — Settings → Pages → Deploy from `main` → `/` (root). Live at `https://senpai-sama7.github.io/douglasmitchell-blog/`
- **Netlify** — drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel** — `npx vercel` in this folder
- **Cloudflare Pages** — connect the repo or direct-upload

## Extending (when you're ready)

This file is deliberately dependency-free. Natural upgrade paths:

1. **Real backend** — port the admin CRUD to a Next.js API + database (the component structure of your existing `DouglasMitchell.info` repo maps 1:1)
2. **Real AI console** — swap the intent engine for an LLM API call that receives `SEED_POSTS` + site content as context (the original site's "Public Knowledge Console" pattern)
3. **Analytics** — wire the Overview panel to a real analytics source instead of `localStorage`

---

*Built with intent. Shipped with confidence. — DM ◆*
