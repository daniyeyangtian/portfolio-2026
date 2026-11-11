# portfolio-2026

Yeyang Dani Tian — personal product design portfolio.

Home: a 3D cassette with three transport keys — About, Projects (a player tile per project; pointing at one winds the tape to its track) and Other (the cassette comes apart into an exploded view as you move the pointer over it). Also: Projects (Verdure, Clicket case studies) and About Me.

Static site — serve the folder so the case studies load in their viewer:

```bash
python3 -m http.server 5181
```

then open http://localhost:5181.

## Assets

Only web-ready images live here. The high-resolution originals (4K renders, Figma exports) stay in
`../portfolio-v1/assets/`, which is the archive of the earlier version and is not part of this repo.
Large renders are served from `assets/<project>/opt/` (max 2880 px wide; JPEG where there is no
transparency).

When an image changes, bump its `?v=` (and the case study's `?v=` in `projects.html`) so browsers
fetch the new file.

## Other Work pages

`other/<n>.html` are the five "Frame 3" strips (1220 wide) of the Figma file *past life*
(FQJ2yBrRlwW8MuBtn41m78), converted to HTML with `../网页搭建 v2/tools/jsx2html.py` and
`build_embed.py` (frame height 17068, `--cut` = `h` in `js/other-work.js`,
`--overrides tools/other_work_overrides.css`). `work.html?p=N` shows the page in an iframe
sized to `h`. After converting, `tools/other_work_opt.py` then `tools/other_work_webp.py`
shrink the images and repoint the pages.
