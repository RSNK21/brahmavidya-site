# AGENTS.md: instructions for AI agents working on brahmavidya.co.in

Read this whole file before changing anything. It is short on purpose.

## What this is

The website of **Brahmavidya**, Mysuru (Indian musicology and Indology). It is a
plain static site: HTML pages + one stylesheet + one script, assembled by a small
Python builder with **no dependencies**. There is no WordPress, no database, no
server code, no npm.

```
site.json          ← contact details, menu, footer, form links (edit here first)
redirects.json     ← old addresses that forward to new ones
templates/base.html← the frame around every page (header, footer, Subscribe)
pages/*.html       ← one file per page; file name = web address
assets/css/site.css← all shared styling (tokens at the top)
assets/js/site.js  ← menu, Subscribe dialog, tabs, videos, photo viewer
assets/css/tools/  ← extra CSS for the three tool pages only
assets/js/tools/   ← extra JS for the three tool pages only
assets/fonts/      ← Brahmavidya fonts (WOFF2)
assets/uploads/    ← images and documents (same folder layout as old WordPress)
build.py           ← builds everything into dist/
check.py           ← verifies dist/ (links, images, placeholders, headings)
```

## The workflow (always)

```bash
python3 build.py      # writes dist/
python3 check.py      # must print "no problems found"
```

Never edit `dist/` by hand; it is rebuilt from scratch each time and is not committed.
GitHub Actions builds, checks and publishes on every push to `main`
(`.github/workflows/deploy.yml`). If `check.py` fails, nothing is published.

## Rules

1. **Addresses are permanent.** `pages/about.html` is served at `/about/`. Do not
   rename a page file unless you also add the old address to `redirects.json`.
   `/stotravahini-privacy-policy/` is linked from Google Play: never move it.
2. **Write site links starting with `/`** (e.g. `/contact/`, `/assets/uploads/x.jpg`).
   The builder makes them relative, in pages and in stylesheets (`url(/assets/...)`),
   so the site also works from a subfolder such as the GitHub Pages preview;
   `check.py` fails on any root-absolute path left over. Exception: paths set from JavaScript at
   runtime are not rewritten; write those relative to the page (see
   `assets/js/tools/bv-mudrana.js`).
3. **Contact details, menu, footer and form links live only in `site.json`.**
   In pages use placeholders: `{{email}}`, `{{phone1}}`, `{{phone2}}`,
   `{{phone1_tel}}`, `{{phone2_tel}}`, `{{course_form}}`, `{{artist_form}}`,
   `{{year}}`, `{{founded}}`, `{{years_active}}`.
4. **One font for the whole site: BV Nanda** (`var(--font)` in CSS). It covers Latin and
   IAST. Devanagari falls back to BV Chitkala and Kannada to Praja Unicode through
   `unicode-range`; do not add Google Fonts. BV Matanga is only for the BVMatanga page
   and decorative Kannada. BV Nanda lacks a few symbols (© · … ₹ arrows); they fall back
   to Georgia, which is fine.
5. **Use the existing components** in `site.css` before writing new CSS:
   `page-head`, `band` / `band-alt` / `band-deep` / `band-sand`, `section-head`, `prose`,
   `grid grid-2|3|4`, `card`, `split`, `figure`, `person`, `facts`, `course`,
   `tabs`, `awardees`, `videos`, `gallery`, `doc-list`, `contact-cards`, `notice`, `verse`,
   buttons `btn btn-filled|btn-tonal|btn-outline`. Colours come from tokens
   (`--madder`, `--deep`, `--ivory`, …). Dark mode follows the device, and the header
   switch can override it (`<html data-theme="dark|light">`, saved in localStorage
   `bv-theme`). A new colour must be a token set in `:root` and in BOTH dark blocks
   (the `prefers-color-scheme` one and `:root[data-theme="dark"]`).
6. **Indic text:** mark it with `lang="sa"`, `lang="hi"` or `lang="kn"`. Never put
   `letter-spacing` or `text-transform` on it.
7. **Images:** put new ones in `assets/uploads/<year>/<month>/` with plain ASCII
   file names, at most ~1800 px on the long side. Always write a real `alt`.
8. **No secrets** in this repository. It is public.
9. **Do not invent facts** (names, dates, awards, fees). Ask the site owner.
10. **Keep the original colour scheme** of brahmavidya.co.in (tokens at the top of
    `site.css`): blush header `#faede0`, cream footer `#ffebcd` with a brown `#775622`
    strip, brown headings `#4c3508`, menu violet `#605be5`, link blue `#046bd2`, slate
    Subscribe `#2c3338`, and the brown logo with "Foundation for Academics and Creativity"
    in the header. Do not swap in a new palette.
11. **No em dashes (—)** anywhere in the site text. Use a comma, colon, brackets or a
    full stop instead. (Number ranges like 1949–1984 keep the short en dash.)

## Common tasks

**Add a page**: copy a similar file in `pages/`, change the header block
(`title`, `description`, `section`) and the content. Add it to `site.json` → `nav`
and/or `footer` if it should be in a menu. Build and check.

**Change the menu**: edit `site.json` → `nav`. `section` on a page decides which
top item is highlighted.

**Add Indian Musicology Day for a new year**: in
`pages/indian-musicology-day-2.html` add a `<button class="tab" role="tab" …>` and a
matching `<div class="tab-panel" role="tabpanel" …>`; copy the 2025 block. Videos use
`<button data-yt="VIDEO_ID">` and load only when clicked.

**Add a course**: copy an `<article class="course">` block in the course page.
All courses use the one application form in `site.json` → `forms.course_application`.

**Add photos to the gallery**: add `<a href="IMG"><img src="IMG" alt="…"></a>` inside a
`<div class="gallery">`. The viewer is automatic.

**Release a new BV Mudrana version**: update version numbers and the two download
URLs (GitHub releases of RSNK21/bvmudrana) in `pages/bv-mudrana.html`, and add the
version to the "How it grew" list.

## Forms (there is no server)

* **Subscribe** (floating button, every page): posts to the WordPress.com newsletter
  list of blog `248154268` (`site.json` → `forms.subscribe`). Subscribers and sending
  are managed in WordPress.com → Subscribers. If `action` is emptied, the button falls
  back to opening an email to the address in `fallback_mailto`.
* **Courses:** one Google Form (`forms.course_application`).
* **Artist Repository:** `forms.artist_profile`. While empty, the button opens an email.
  Put a Google Form link there to switch.

## The three tool pages

`bv-mudrana`, `kannada-ascii-to-unicode-converter`, `bvmatanga-kannada-font` have their
own CSS/JS in `assets/css/tools/` and `assets/js/tools/` (named in each page's header
block). Their converter engine is `assets/js/tools/bv-legacy-converters.js`
(Nudi/Baraha, Praja, Chanakya, Nalanda ↔ Unicode). The Kannada Tools page doubles as a
Microsoft Word add-in when opened with `?word-addin=1`. Only its Aksharamukha panel sends
text to an outside service; everything else runs in the browser.
