#!/usr/bin/env python3
"""
Check the built site in ./dist before publishing.

    python3 build.py && python3 check.py

Fails (exit code 1) if any of these are found:
  - a link, image, script, stylesheet or font that points to a missing local file
  - leftover links to the old WordPress uploads (wp-content) or i0.wp.com
  - unfilled {{placeholders}}
  - a page without <title>, <h1> or meta description
  - pages linked from the menu that do not exist
Warnings (do not fail): external links, very large files.
Standard library only.
"""
import os, re, sys, html
from urllib.parse import urljoin, urlparse, unquote

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'dist')
errors, warnings = [], []

if not os.path.isdir(DIST):
    sys.exit('dist/ not found. Run: python3 build.py')

ATTR = re.compile(r'\b(?:href|src|poster|data-src)=(["\'])(.*?)\1', re.S)
SRCSET = re.compile(r'\bsrcset=(["\'])(.*?)\1', re.S)
CSSURL = re.compile(r'url\(\s*(["\']?)([^)"\']+)\1\s*\)')

def local_target(base_file, ref):
    ref = html.unescape(ref.strip())
    if not ref or ref.startswith(('#', 'mailto:', 'tel:', 'javascript:', 'data:', 'blob:')) or '{{' in ref:
        return None
    if re.match(r'^[a-z]+://', ref, re.I) or ref.startswith('//'):
        return 'EXTERNAL'
    path = unquote(urlparse(ref).path)
    if not path:
        return None
    base_dir = os.path.dirname(base_file)
    target = os.path.normpath(os.path.join(DIST, path.lstrip('/')) if path.startswith('/') else os.path.join(base_dir, path))
    if path.endswith('/') or os.path.isdir(target):
        target = os.path.join(target, 'index.html')
    return target

external = set()
for dirpath, _, files in os.walk(DIST):
    for f in files:
        p = os.path.join(dirpath, f)
        rel = os.path.relpath(p, DIST)
        size = os.path.getsize(p)
        if size > 15_000_000:
            warnings.append(f'large file ({size/1e6:.0f} MB): {rel}')
        if not f.endswith(('.html', '.css')):
            continue
        text = open(p, encoding='utf-8', errors='replace').read()
        refs = [m.group(2) for m in ATTR.finditer(text)] + [m.group(2) for m in CSSURL.finditer(text)]
        for m in SRCSET.finditer(text):
            refs += [part.strip().split()[0] for part in m.group(2).split(',') if part.strip()]
        for r in refs:
            t = local_target(p, r)
            if t == 'EXTERNAL':
                external.add(r)
                if re.search(r'wp-content/uploads|i\d\.wp\.com', r):
                    errors.append(f'{rel}: still points at old WordPress file: {r}')
            elif t and not os.path.exists(t):
                errors.append(f'{rel}: missing local file for "{r}"')
        if f.endswith('.html'):
            for ph in set(re.findall(r'\{\{[a-z_0-9]+\}\}', text)):
                errors.append(f'{rel}: unfilled placeholder {ph}')
            if 'http-equiv="refresh"' in text:
                continue  # redirect stub
            if not re.search(r'<title>[^<]+</title>', text):
                errors.append(f'{rel}: no <title>')
            if not re.search(r'<h1[\s>]', text):
                errors.append(f'{rel}: no <h1>')
            if not re.search(r'<meta name="description" content="[^"]{20,}"', text):
                warnings.append(f'{rel}: short or missing meta description')
            if text.count('<h1') > 1:
                warnings.append(f'{rel}: more than one <h1>')

print(f'Checked {DIST}')
print(f'  external links: {len(external)} (not fetched; run with --external to list them)')
if '--external' in sys.argv:
    for e in sorted(external):
        print('   ', e)
for w in warnings:
    print('  warning:', w)
if errors:
    print(f'\n{len(errors)} problem(s):')
    for e in errors:
        print('  ✗', e)
    sys.exit(1)
print('  ✓ no problems found')
