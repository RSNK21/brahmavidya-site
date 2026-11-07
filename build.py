#!/usr/bin/env python3
"""
Build brahmavidya.co.in from source into ./dist

    python3 build.py              # normal build (for GitHub Pages / any web host)
    python3 build.py --file-links # links point at .../index.html (for previews that
                                  # don't serve folder indexes, or opening from disk)

Standard library only. No installs needed.

How a page is made
------------------
pages/<path>.html  ->  dist/<path>/index.html      (pages/index.html -> dist/index.html)

Each page file starts with a small header between '---' lines:

    ---
    title: About
    description: One sentence for search engines and link previews.
    section: about          # which top-menu item is highlighted (see site.json nav)
    layout: default         # default | wide (wide = no reading-width limit, for tools)
    css: /assets/css/tools/kannada.css      # optional extra stylesheet(s), comma separated
    js:  /assets/js/tools/kannada.js        # optional extra script(s), comma separated
    image: /assets/uploads/...              # optional link-preview image
    ---
    <section> ... page HTML ... </section>

Write links and image paths starting with "/" (e.g. /about/, /assets/uploads/x.jpg).
The builder turns them into relative paths, so the site works on any host or folder.

Inside page HTML you may use these placeholders:
    {{email}} {{phone1}} {{phone2}} {{course_form}} {{artist_form}} {{year}}
"""
import json, os, re, shutil, sys, html, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC_PAGES = os.path.join(ROOT, 'pages')
DIST = os.path.join(ROOT, 'dist')
FILE_LINKS = '--file-links' in sys.argv

site = json.load(open(os.path.join(ROOT, 'site.json'), encoding='utf-8'))
template = open(os.path.join(ROOT, 'templates', 'base.html'), encoding='utf-8').read()
redirects = json.load(open(os.path.join(ROOT, 'redirects.json'), encoding='utf-8'))
YEAR = str(datetime.date.today().year)
esc = lambda s: html.escape(s or '', quote=True)


# ---------------------------------------------------------------- helpers
def parse_page(path):
    raw = open(path, encoding='utf-8').read()
    meta, body = {}, raw
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', raw, re.S)
    if m:
        for line in m.group(1).splitlines():
            line = line.split(' #', 1)[0].rstrip()
            if ':' in line:
                k, v = line.split(':', 1)
                meta[k.strip()] = v.strip()
        body = raw[m.end():]
    return meta, body


def url_for(rel_src):
    """pages/about.html -> /about/ ; pages/index.html -> /"""
    p = rel_src[:-5].replace(os.sep, '/')
    if p == 'index':
        return '/'
    if p.endswith('/index'):
        p = p[:-6]
    return '/' + p.strip('/') + '/'


def out_path(url):
    return os.path.join(DIST, url.strip('/'), 'index.html') if url != '/' else os.path.join(DIST, 'index.html')


def relativize(doc, page_url):
    """Turn root-absolute "/x" paths into paths relative to page_url."""
    depth = 0 if page_url == '/' else page_url.strip('/').count('/') + 1
    prefix = '../' * depth or './'

    def fix(u):
        if not u.startswith('/') or u.startswith('//'):
            return u
        path, sep, rest = u.partition('#')
        path, qsep, query = path.partition('?')
        new = prefix + path.lstrip('/')
        if FILE_LINKS and (path.endswith('/') or path == ''):
            new += 'index.html'
        if new == './' and not FILE_LINKS:
            new = './'
        return new + (qsep + query if qsep else '') + (sep + rest if sep else '')

    def attr(m):
        name, q, val = m.group(1), m.group(2), m.group(3)
        if name == 'srcset':
            parts = [p.strip() for p in val.split(',')]
            val = ', '.join(' '.join([fix(p.split()[0])] + p.split()[1:]) for p in parts if p)
        else:
            val = fix(val)
        return f'{name}={q}{val}{q}'

    doc = re.sub(r'\b(href|src|srcset|poster|data-src|action)=(["\'])(/[^"\']*)\2', attr, doc)
    doc = re.sub(r'url\((["\']?)(/[^)"\']+)\1\)', lambda m: f'url({m.group(1)}{fix(m.group(2))}{m.group(1)})', doc)
    return doc


def icon(name):
    paths = {
        'menu': 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
        'close': 'M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.29-6.3z',
        'expand': 'M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z',
        'mail': 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
        'phone': 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
        'place': 'M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z',
        'up': 'M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z',
        'youtube': 'M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z',
        'facebook': 'M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14A28 28 0 0 0 14.64 2C11.93 2 10 3.66 10 6.7v2.8H7v4h3V22h4z',
        'instagram': 'M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm4.8-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM20.9 7.1a5.3 5.3 0 0 0-1.45-3.75A5.3 5.3 0 0 0 15.7 1.9C14.2 1.8 9.8 1.8 8.3 1.9a5.3 5.3 0 0 0-3.75 1.44A5.3 5.3 0 0 0 3.1 7.1C3 8.6 3 13 3.1 14.5c.1 1.4.44 2.65 1.45 3.75A5.3 5.3 0 0 0 8.3 19.7c1.5.1 5.9.1 7.4 0 1.4-.1 2.65-.44 3.75-1.45a5.3 5.3 0 0 0 1.45-3.75c.1-1.5.1-5.9 0-7.4z',
        'x': 'M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77zm-1.08 16.17h1.7L7.4 4.73H5.58z',
    }
    return f'<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="{paths[name]}"/></svg>'


def build_nav(section):
    out = ['<ul class="nav-list">']
    for i, item in enumerate(site['nav']):
        active = ' is-active' if item.get('section') == section else ''
        cur = ' aria-current="true"' if active else ''
        kids = item.get('children')
        if kids:
            out.append(f'<li class="nav-item has-sub{active}">'
                       f'<a class="nav-link" href="{item["href"]}"{cur}>{esc(item["label"])}</a>'
                       f'<button class="sub-toggle" type="button" aria-expanded="false" aria-controls="sub-{i}" aria-label="Show {esc(item["label"])} pages">{icon("expand")}</button>'
                       f'<ul class="sub" id="sub-{i}">')
            for k in kids:
                out.append(f'<li><a href="{k["href"]}">{esc(k["label"])}</a></li>')
            out.append('</ul></li>')
        else:
            out.append(f'<li class="nav-item{active}"><a class="nav-link" href="{item["href"]}"{cur}>{esc(item["label"])}</a></li>')
    out.append('</ul>')
    return ''.join(out)


def build_footer():
    c = site['contact']
    cols = []
    for col in site['footer']['columns']:
        links = ''.join(f'<li><a href="{l["href"]}">{esc(l["label"])}</a></li>' for l in col['links'])
        cols.append(f'<div class="f-col"><h2 class="f-title">{esc(col["title"])}</h2><ul>{links}</ul></div>')
    phones = ''.join(f'<li><a href="tel:{p.replace(" ", "")}">{icon("phone")}<span>{esc(p)}</span></a></li>' for p in c['phones'])
    social = ''.join(f'<a class="soc" href="{esc(s["url"])}" rel="noopener" target="_blank" aria-label="{esc(s["name"])}">{icon(s["icon"])}</a>'
                     for s in site.get('social', []) if s.get('url'))
    social_html = f'<div class="f-social">{social}</div>' if social else ''
    return f'''
    <div class="f-brand">
      <a class="f-logo" href="/"><img src="/assets/img/brahmavidya-logo-240.webp" width="120" height="116" alt="Brahmavidya"></a>
      <p class="f-tag">Indian Musicology and Indology · Mysuru, since {site["founded"]}</p>
      {social_html}
    </div>
    {''.join(cols)}
    <div class="f-col f-contact">
      <h2 class="f-title">Get in touch</h2>
      <ul>
        <li><a href="mailto:{c["email"]}">{icon("mail")}<span>{esc(c["email"])}</span></a></li>
        {phones}
        <li><a href="{esc(c["office"]["map"])}" target="_blank" rel="noopener">{icon("place")}<span>{"<br>".join(esc(l) for l in c["office"]["lines"])}</span></a></li>
      </ul>
    </div>'''


def fill(text):
    c = site['contact']
    rep = {
        '{{email}}': c['email'], '{{phone1}}': c['phones'][0], '{{phone2}}': c['phones'][1],
        '{{phone1_tel}}': c['phones'][0].replace(' ', ''), '{{phone2_tel}}': c['phones'][1].replace(' ', ''),
        '{{course_form}}': site['forms']['course_application'],
        '{{artist_form}}': site['forms']['artist_profile'] or f'mailto:{c["email"]}?subject=Artist%20Repository%20profile',
        '{{year}}': YEAR, '{{founded}}': str(site['founded']),
        '{{years_active}}': str(int(YEAR) - site['founded']),
    }
    for k, v in rep.items():
        text = text.replace(k, v)
    return text


# ---------------------------------------------------------------- build
def main():
    if os.path.exists(DIST):
        shutil.rmtree(DIST)
    shutil.copytree(os.path.join(ROOT, 'assets'), os.path.join(DIST, 'assets'))
    for extra in ('CNAME', 'robots.txt'):
        if os.path.exists(os.path.join(ROOT, extra)):
            shutil.copy(os.path.join(ROOT, extra), DIST)

    footer = build_footer()
    sub = site['forms']['subscribe']
    pages = []
    for dirpath, _, files in os.walk(SRC_PAGES):
        for f in sorted(files):
            if f.endswith('.html'):
                pages.append(os.path.relpath(os.path.join(dirpath, f), SRC_PAGES))

    built = []
    for rel in sorted(pages):
        meta, body = parse_page(os.path.join(SRC_PAGES, rel))
        url = '/404.html' if rel == '404.html' else url_for(rel)
        title = meta.get('title', site['name'])
        full_title = site['name'] + ' · ' + site['tagline'] if url == '/' else f'{title} · {site["name"]}'
        extra_css = ''.join(f'<link rel="stylesheet" href="{h.strip()}">' for h in meta.get('css', '').split(',') if h.strip())
        extra_js = ''.join(f'<script src="{h.strip()}" defer></script>' for h in meta.get('js', '').split(',') if h.strip())
        canonical = site['url'] + ('/' if url == '/' else url)
        image = meta.get('image') or site['share_image']
        doc = template
        rep = {
            '{{lang}}': meta.get('lang', site['lang']),
            '{{title}}': esc(full_title),
            '{{og_title}}': esc(title if url != '/' else site['name']),
            '{{description}}': esc(meta.get('description', site['description'])),
            '{{canonical}}': canonical,
            '{{og_image}}': site['url'] + image,
            '{{extra_css}}': extra_css,
            '{{extra_js}}': extra_js,
            '{{nav}}': build_nav(meta.get('section', '')),
            '{{footer}}': footer,
            '{{layout}}': meta.get('layout', 'default'),
            '{{sub_action}}': sub['action'], '{{sub_blog}}': sub['blog_id'], '{{sub_mailto}}': sub['fallback_mailto'],
            '{{site_url}}': site['url'],
            '{{content}}': body,
        }
        for k, v in rep.items():
            doc = doc.replace(k, v)
        doc = fill(doc)
        target = os.path.join(DIST, '404.html') if rel == '404.html' else out_path(url)
        if rel == '404.html':
            doc = doc.replace('href="/', f'href="{site["url"]}/').replace('src="/', f'src="{site["url"]}/') if not FILE_LINKS else relativize(doc, '/')
        else:
            doc = relativize(doc, url)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        open(target, 'w', encoding='utf-8').write(doc)
        if rel != '404.html' and meta.get('sitemap', 'yes') != 'no':
            built.append(url)

    # Redirect stubs for old WordPress addresses
    for old, new in redirects.items():
        if old.startswith('_'):
            continue
        target = out_path(old)
        if os.path.exists(target):
            print(f'  ! redirect {old} skipped: a real page lives there'); continue
        rel_new = relativize(f'<a href="{new}">', old)
        href = re.search(r'href="([^"]*)"', rel_new).group(1)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        open(target, 'w', encoding='utf-8').write(
            f'<!doctype html><meta charset="utf-8"><title>Moved</title>'
            f'<link rel="canonical" href="{site["url"]}{new}"><meta name="robots" content="noindex">'
            f'<meta http-equiv="refresh" content="0; url={href}">'
            f'<p>This page has moved to <a href="{href}">{site["url"]}{new}</a>.</p>')

    # sitemap
    today = datetime.date.today().isoformat()
    sm = ''.join(f'<url><loc>{site["url"]}{u}</loc><lastmod>{today}</lastmod></url>' for u in built)
    open(os.path.join(DIST, 'sitemap.xml'), 'w').write(
        f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{sm}</urlset>')
    if not os.path.exists(os.path.join(DIST, 'robots.txt')):
        open(os.path.join(DIST, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nSitemap: {site["url"]}/sitemap.xml\n')
    open(os.path.join(DIST, '.nojekyll'), 'w').write('')
    print(f'Built {len(built)} pages and {len([k for k in redirects if not k.startswith("_")])} redirects into dist/')


if __name__ == '__main__':
    main()
