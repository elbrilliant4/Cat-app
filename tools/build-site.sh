#!/usr/bin/env bash
# Assembles the published site in _site: the app from main (dist/) at the
# root, the review branch (preview-src/dist/, when checked out) at /preview/,
# each with a version.json (build number = commits on its branch), and a
# review pack at /preview/review/ when one is given.
#   tools/build-site.sh [review pack dir]
set -euo pipefail
stamp() {
  printf '{"build": %s, "commit": "%s", "channel": "%s", "date": "%s"}\n' \
    "$(git -C "$1" rev-list --count HEAD)" "$(git -C "$1" rev-parse --short HEAD)" "$2" "$(date -u +%FT%TZ)" > "$1/dist/version.json"
}
stamp . live
rm -rf _site && mkdir -p _site
cp -r dist/. _site/
if [ -d preview-src/dist ]; then
  stamp preview-src preview
  mkdir -p _site/preview
  cp -r preview-src/dist/. _site/preview/
fi
pack="${1:-}"
if [ -n "$pack" ] && [ -f "$pack/index.html" ] && [ -d _site/preview ]; then
  rm -rf _site/preview/review && mkdir -p _site/preview/review
  cp -r "$pack"/. _site/preview/review/
fi
# Short link for reviewers: /review/ opens the latest preview's review pack.
mkdir -p _site/review
printf '%s\n' '<!doctype html><meta charset="utf-8"><title>Mochi review pack</title>' \
  '<meta http-equiv="refresh" content="0; url=../preview/review/">' \
  '<p>Opening the latest review pack: <a href="../preview/review/">preview/review/</a></p>' > _site/review/index.html
