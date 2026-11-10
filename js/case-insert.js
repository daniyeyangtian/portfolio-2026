// Case studies: insert a text section (heading + lead line + paragraph, beside the heading or
// textTop px below it) into the exported
// frame at frame-y `top`. Everything from `from` down moves down to make room, so the next
// section starts `gap` px below the new one's text. Runs after the page's own layout scripts.
// Returns how far the page below moved (keep the section anchors in projects.html in step).
window.insertCaseSection = ({ top, from, gap, heading, lead, body, headX, textX, textW, textTop = 0, bodyColor, columns }) => {
  const frame = document.getElementById("frame");
  if (!frame) return 0;
  const z = frame.getBoundingClientRect().width / 1220;
  const yOf = el => (el.getBoundingClientRect().top - frame.getBoundingClientRect().top) / z;
  const bottomOf = el => (el.getBoundingClientRect().bottom - frame.getBoundingClientRect().top) / z;

  // the new section, as its own layer on the frame. Its text is one block, or `columns`:
  // several blocks side by side, each [{ x, w, lead, body }]
  const blocks = columns || [{ x: textX, w: textW, lead, body }];
  const sec = document.createElement("section");
  sec.className = "case-insert";
  sec.setAttribute("aria-labelledby", "case-insert-h");
  sec.style.cssText = `position:absolute;left:0;top:${top}px;width:1220px;z-index:2;font-family:Geist,sans-serif`;
  sec.innerHTML = `
    <h2 id="case-insert-h" style="position:absolute;left:${headX}px;top:0;margin:0;font:500 28px/normal Geist,sans-serif;color:#000">${heading}</h2>` +
    blocks.map(c => `
    <div class="case-insert-text" style="position:absolute;left:${c.x}px;top:${textTop}px;width:${c.w}px">
      <p style="margin:0;font:400 20px/1.4 Geist,sans-serif;color:#141414">${c.lead}</p>
      <p style="margin:16px 0 0;font:400 16px/1.5 Geist,sans-serif;color:${bodyColor}">${c.body}</p>
    </div>`).join("");
  frame.appendChild(sec);
  const textH = Math.max(textTop + Math.max(...[...sec.querySelectorAll(".case-insert-text")].map(d => d.offsetHeight)), 37);
  const shift = Math.max(0, Math.round(top + textH + gap - from));
  if (!shift) return 0;

  // move one layer down by `shift` (translate, adding to any it already has)
  const nudge = el => {
    const cur = parseFloat((getComputedStyle(el).translate.split(" ")[1]) || 0) || 0;
    const x = getComputedStyle(el).translate.split(" ")[0];
    el.style.translate = `${x === "none" ? "0px" : x} ${cur + shift}px`;
  };
  // Inside the window that shows this part of the page: layers starting at or below `from`
  // move; a group that straddles `from` is opened up and its children are sorted the same way;
  // anything else that straddles it (a background, a long line) stays.
  const sort = el => {
    if (getComputedStyle(el).display === "contents") { [...el.children].forEach(sort); return; }
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height && !el.children.length) return;
    const y0 = yOf(el), y1 = bottomOf(el);
    if (y0 >= from - 0.5) { nudge(el); return; }
    if (y1 > from && el.children.length) [...el.children].forEach(sort);
  };
  [...frame.children].forEach(w => {
    if (w === sec) return;
    const cs = getComputedStyle(w), wTop = parseFloat(cs.top) || 0, wH = parseFloat(cs.height) || 0;
    const wBottom = wTop + wH;
    if (wTop >= from) { w.style.top = wTop + shift + "px"; return; }   // a window wholly below
    if (wBottom <= from) return;                                        // wholly above
    // a window holds a copy of the page (its root layer inside); a page without windows is its root
    const root = w.dataset.nodeId ? w : (w.querySelector("[data-node-id]") || w.firstElementChild);
    [...root.children].forEach(sort);
    w.style.height = wH + shift + "px";
  });
  const h = parseFloat(getComputedStyle(frame).height) + shift;
  document.head.insertAdjacentHTML("beforeend", `<style>#frame.case-frame { height: ${h}px; }</style>`);
  return shift;
};
