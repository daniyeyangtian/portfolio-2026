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
