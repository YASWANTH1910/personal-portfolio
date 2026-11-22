(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const themeBtn = $("#themeToggle");
  const setTheme = (t) => {
    root.dataset.theme = t;
    themeBtn.innerHTML = t === "dark" ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    try { localStorage.setItem("theme", t); } catch (e) {}
  };
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  setTheme(saved || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
  themeBtn.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

  /* ---------- nav: scrolled state, progress bar, active link ---------- */
  const nav = $("#nav");
  const progress = $(".scroll-progress");
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 10);
    const h = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = $$(".nav-links a");
  const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- mobile menu ---------- */
  const menuBtn = $("#menuBtn");
  const navLinks = $("#navLinks");
  const toggleMenu = (open) => {
    navLinks.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  };
  menuBtn.addEventListener("click", () => toggleMenu(!navLinks.classList.contains("open")));
  links.forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && toggleMenu(false));

  /* ---------- typing effect ---------- */
  const typed = $("#typed");
  const words = ["scalable web apps", "clean React UIs", "reliable REST APIs", "data-driven dashboards"];
  if (!reduceMotion && typed) {
    let w = 0, i = words[0].length, deleting = true;
    const tick = () => {
      const word = words[w];
      typed.textContent = word.slice(0, i);
      if (deleting) {
        i--;
        if (i < 0) { deleting = false; w = (w + 1) % words.length; i = 0; }
        setTimeout(tick, 45);
      } else {
        i++;
        if (i > words[w].length) { deleting = true; i = words[w].length; setTimeout(tick, 1800); return; }
        setTimeout(tick, 85);
      }
    };
    setTimeout(tick, 2200);
  }

  /* ---------- reveal on scroll + counters ---------- */
  const countUp = (el) => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now(), dur = 1200;
    const step = (t) => {
      const p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const revealer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        $$("[data-count]", e.target).forEach(countUp);
        revealer.unobserve(e.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el, idx) => {
    el.style.transitionDelay = (el.closest(".projects, .skills-grid, .hero-text") ? (idx % 4) * 70 : 0) + "ms";
    revealer.observe(el);
  });

  /* ---------- project filters ---------- */
  const filters = $$(".filter");
  const projects = $$(".project");
  filters.forEach((btn) =>
    btn.addEventListener("click", () => {
      filters.forEach((b) => { b.classList.toggle("active", b === btn); b.setAttribute("aria-selected", b === btn); });
      const f = btn.dataset.filter;
      projects.forEach((p) => p.classList.toggle("hide", f !== "all" && p.dataset.cat !== f));
    })
  );

  /* ---------- copy email ---------- */
  const toast = document.createElement("div");
  toast.className = "toast";
  document.body.appendChild(toast);
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1800);
  };
  $$("[data-copy]").forEach((b) =>
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); showToast("Email copied to clipboard"); }
      catch (e) { showToast(b.dataset.copy); }
    })
  );

  /* ---------- contact form (Google Sheets) ---------- */
  const scriptURL =
    "https://script.google.com/macros/s/AKfycbyRjbsNqP7qGjoNF4aQy6QYSfHrD3AwFIi9MlU9Yt-9Yo57lO_W36imhAUt0U_VVYguAw/exec";
  const form = document.forms["submit-to-google-sheet"];
  const msg = $("#msg");
  const submitBtn = $("#submitBtn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    $$("input, textarea", form).forEach((f) => {
      const valid = f.checkValidity() && f.value.trim() !== "";
      f.closest(".field").classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    if (!ok) { msg.className = "form-msg err"; msg.textContent = "Please fill in all fields with a valid email."; return; }

    submitBtn.disabled = true;
    submitBtn.querySelector("span").textContent = "Sending…";
    fetch(scriptURL, { method: "POST", body: new FormData(form) })
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        msg.className = "form-msg ok";
        msg.textContent = "Thanks! Your message was sent — I'll reply soon.";
        form.reset();
      })
      .catch(() => {
        msg.className = "form-msg err";
        msg.textContent = "Something went wrong. Please email me directly at yaswanth1910@gmail.com.";
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.querySelector("span").textContent = "Send message";
        setTimeout(() => (msg.textContent = ""), 6000);
      });
  });
  $$("input, textarea", form).forEach((f) =>
    f.addEventListener("input", () => f.closest(".field").classList.remove("invalid"))
  );

  /* ---------- footer year ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
