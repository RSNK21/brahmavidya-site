# Archive of the WordPress brahmavidya.co.in (7 November 2026)

This branch is a backup of the old WordPress site, taken just before
brahmavidya.co.in moved to the new code site (branch `main` of this repository).
Nothing here is published.

## What is here

- `pages/`: every published WordPress page (42) and the one post, saved as the
  finished HTML a visitor received on 7 November 2026. Open them in a browser to see
  the text; styling and images still load from WordPress while that site exists.
- `wp-content/uploads/`: the original, full-size images and documents the site used
  (same folders as WordPress), before they were resized for the new site.
- `notes-original-page-bodies/`: the main content block of key pages, including the
  hand-coded tool pages (BV Mudrana, Kannada Tools, BVMatanga) as they were on WordPress.

## The complete backup

The full WordPress site (database, theme, plugins, every upload, drafts, settings) is
kept by **Jetpack Backup** on WordPress.com: 437 restore points from 9 September 2025,
the latest on 7 November 2026 04:26 UTC. To restore: WordPress.com → the site →
Jetpack → Backup → choose a date → Restore.

The WordPress site itself was not deleted. On 7 November 2026 its one suspicious plugin,
"Plugin Premium", had been switched off.

## Going back to WordPress (if ever needed)

In WordPress.com → Domains → brahmavidya.co.in → DNS records, remove the four GitHub
A records (185.199.108-111.153) and the GitHub AAAA records, restore the WordPress.com
default A records, and set the `www` CNAME back to `brahmavidya.co.in.`
