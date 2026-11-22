// Top nav: a flat bar in the style of a label on lab gear. The pages are written in the
// HTML (<nav class="site-nav"><ul><li><a>…); this adds the name on the left, puts each
// page in lowercase and gives it a small index number (01, 02, …). The current page is
// the one with aria-current="page" (styles in css/site.css).
(() => {
  const nav = document.querySelector(".site-nav");
  const list = nav?.querySelector("ul");
  if (!list) return;
  const links = [...list.querySelectorAll("a")];
  links.forEach((a, i) => {
    const t = a.textContent.trim().toLowerCase();
    a.innerHTML = `<span class="ni" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span>${t}</span>`;
    if (a.getAttribute("aria-disabled") === "true") a.addEventListener("click", e => e.preventDefault());
  });
  const brand = document.createElement("a");
  brand.className = "nav-brand";
  brand.href = links[0].getAttribute("href");
  brand.innerHTML = '<span class="nb-name">dani yeyang tian</span><span class="nb-role">product designer</span>';
  nav.prepend(brand);
})();
