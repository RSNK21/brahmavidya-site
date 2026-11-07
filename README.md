# brahmavidya.co.in

The website of **Brahmavidya**, Mysuru: Indian musicology and Indology.

A small, fast static website. Every page is a plain HTML file in `pages/`. Contact
details, menus and form links are in one settings file, `site.json`. A tiny Python
script (no installs needed) puts it all together.

## Update the site

1. Edit a file in `pages/` (or `site.json` for contact details and menus).
2. Commit and push to `main` on GitHub.
3. GitHub builds, checks and publishes it automatically within a minute or two.

To try it on your own computer first:

```bash
python3 build.py        # makes the finished site in dist/
python3 check.py        # checks every link and image
python3 -m http.server -d dist 8000   # then open http://localhost:8000
```

AI agents: read [AGENTS.md](AGENTS.md) first.

## What's where

| You want to change… | Edit |
| --- | --- |
| Email, phone, address | `site.json` → `contact` |
| Top menu or footer links | `site.json` → `nav`, `footer` |
| Social media icons | `site.json` → `social` (add the profile URL) |
| Course application form | `site.json` → `forms.course_application` |
| A page's words or pictures | `pages/<page>.html` |
| Colours, spacing, buttons | `assets/css/site.css` (tokens at the top) |
| Images and PDFs | `assets/uploads/` |
| An old address that should forward | `redirects.json` |

## Pages (24)

Home · About · Our Inspiration · Faculty and Scholars · Artist Repository ·
Short-term courses (overview + Saṅgītam, Nāṭyam, Yoga, Ayurveda) · Digital Tools ·
EyM Sanskrit OCR · Kannada Tools · BVMatanga Font · BV Mudrana · Stotravahini Privacy
Policy · Downloads · Indian Musicology Day · Gallery · Contact · Privacy Policy ·
Terms and Conditions · Disclaimer · (Page not found)

## Typeface

The whole site is set in **BV Nanda** (Brahmavidya, from Nalandagar). Devanagari
appears in **BV Chitkala** and Kannada in **Praja Unicode**, switched automatically by the
browser. **BV Matanga** is used on its own page. All fonts are in `assets/fonts/`.

## Going live (one time)

The site is published by GitHub Pages. To serve it at brahmavidya.co.in:

1. GitHub → this repository → Settings → Pages → Source: **GitHub Actions**.
2. Add a file named `CNAME` containing `brahmavidya.co.in` and push.
3. Point the domain's DNS at GitHub Pages (A records `185.199.108.153`,
   `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; `www` CNAME to
   `rsnk21.github.io`). Then tick **Enforce HTTPS** in Settings → Pages.

Until step 3, the old WordPress site stays live and nothing changes for visitors.
