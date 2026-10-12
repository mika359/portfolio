# Portfolio

Personal portfolio of Mykhaylo Levytskyy, Information Technology graduate focused on cybersecurity and software development.

The hero shows a lion drawn with 0s, 1s and symbols on a canvas. It lies at its resting place, follows the mouse with its head and yawns, or walks across the screen on request.

## Features

- Three languages (English, Portuguese, Ukrainian), picked from the saved choice or the browser language.
- Dark and light themes without a flash on load.
- `/cv` page that shows the Portuguese or English CV in the site's style, with a download button for the original PDF of the version being viewed.
- Projects page, skills, education and contact sections.
- Responsive from phone to desktop, keyboard accessible, respects reduced motion.

## Stack

Next.js 16 (App Router, static export), React 19, TypeScript, Tailwind CSS 4, `sharp` for image processing.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in out/
npm run lint
```

## Project structure

```
src/app/          pages (/, /projects, /cv) and global styles
src/components/   UI components, including LionCanvas
src/data/         projects, skills and CV content
src/i18n/         translations (en, pt, uk) and the language provider
src/lib/          theme and lion mode helpers
public/lion/      lion pose maps used by the canvas
public/downloads/ original CV PDFs
scripts/          asset build scripts
```

## Asset scripts

- `npm run lion:build` regenerates the lion pose maps in `public/lion/` from reference images in `lion-source/`.
- `node scripts/build-photo.mjs` builds `public/me.jpg` (4:5 crop and colour correction) from `photo-source/m_portfolio.jpg`.

The source images in `lion-source/` and `photo-source/` are not part of this repository, so these scripts only run on a machine that has them. The generated files in `public/` are committed, so the site builds without them.

## Deployment

The site is exported as static files (`output: "export"`) and hosted on Render. Build command `npm install && npm run build`, publish directory `out`.
