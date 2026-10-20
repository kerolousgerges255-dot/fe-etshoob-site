// "قالوا عن المعهد" — testimonial carousel
// 10 people from ROADMAP §3.3 in order. Static data, no DB needed.
// Auto-advances every 15s, supports dots, buttons, swipe, keyboard arrows.

const CAROUSEL_INTERVAL = 15_000; // ms

const testimonials = [
  {
    name: "الأنبا مقار",
    role: "أسقف الشرقية ومدينة العاشر",
    text: "تجربة الدراسة في المعهد كانت مجدية جدا، تعلّمت الكثير عن الكتاب المقدس والعمق الروحي للنصوص.",
  },
  {
    name: "القس جوارجيوس القمص فيلبس",
    role: "مدير معهد في اتشوب",
    text: "يمثل المعهد منصة مثالية لنشر الوعي الديني، والضيوف يرحبون بفكرة التعلم أونلاين بمرونة تامة.",
  },
  {
    name: "قس قزمان عياد",
    role: "واحد من مدرسي المعهد",
    text: "ألاحظ التزام الطلاب الكبير وحماسهم في كل محاضرة، والجو الروحي هو العامل الأهم في النجاح.",
  },
  {
    name: "مينا جيد",
    role: "خريج المعهد",
    text: "منذ أن تخرجت من المعهد، اكتسبت منظورا جديدا للكتاب المقدس، وتجربة المجتمع كانت لا تُقدّر بثمن.",
  },
  {
    name: "شريف شوقي",
    role: "خريج المعهد",
    text: "الموارد التعليمية وتسجيلات المحاضرات ساعدتني على مراجعة المادة في أي وقت أحتاجه.",
  },
  {
    name: "رانيا إيراد",
    role: "خريجة المعهد",
    text: "دعم المجتمع والإرشاد من المدرسين كان له تأثير حقيقي في رحلتي الروحية.",
  },
  {
    name: "روماني عادل",
    role: "خريج المعهد",
    text: "أعجبتني التوازن بين النظرية والتطبيق العملي في كل وحدة دراسية.",
  },
  {
    name: "كيرلس رؤوف",
    role: "خريج المعهد",
    text: "المنهجية التعليمية كانت واضحة ومنظمة وتحترم مستويات المعرفة السابقة المختلفة.",
  },
  {
    name: "ماريان ملطي",
    role: "خريجة المعهد",
    text: "قسم التأملات بعد كل دورة ساعدني على ترسيخ الدروس طوال الأسبوع.",
  },
  {
    name: "ماركو منير",
    role: "خريج المعهد",
    text: "أنصح به بشدة لأي شخص يسعى لتعميق فهمه للكتاب المقدس في بيئة داعمة.",
  },
];

// ── DOM refs ───────────────────────────────────────────────────────────────
const container = document.getElementById("testimonials");
if (!container) throw new Error("missing #testimonials");

const track = document.createElement("div");
track.className = "testimonials-track";

const slides = testimonials.map((t) => {
  const slide = document.createElement("div");
  slide.className = "testimonial-slide";
  slide.innerHTML = `
    <div class="quote-mark">“</div>
    <blockquote>${esc(t.text)}</blockquote>
    <footer>
      <strong>${esc(t.name)}</strong>
      ${t.role ? `<span class="role">${esc(t.role)}</span>` : ""}
    </footer>`;
  track.appendChild(slide);
  return slide;
});

const nav = document.createElement("div");
nav.className = "testimonials-nav";

const prevBtn = document.createElement("button");
prevBtn.className = "carousel-btn prev";
prevBtn.setAttribute("aria-label", "السابق");
prevBtn.textContent = "◀";

const nextBtn = document.createElement("button");
nextBtn.className = "carousel-btn next";
nextBtn.setAttribute("aria-label", "التالي");
nextBtn.textContent = "▶";

const dots = testimonials.map((_, i) => {
  const dot = document.createElement("button");
  dot.className = "testimonial-dot" + (i === 0 ? " active" : "");
  dot.setAttribute("aria-label", `الشهادة ${i + 1}`);
  nav.appendChild(dot);
  return dot;
});

nav.appendChild(prevBtn);
nav.appendChild(nextBtn);

const carousel = document.createElement("div");
carousel.className = "testimonials-carousel";
carousel.appendChild(track);
carousel.appendChild(nav);
container.appendChild(carousel);

// ── Carousel logic ─────────────────────────────────────────────────────────
let currentIndex = 0;
let autoSlideInterval = null;
let isTransitioning = false;

function showSlide(index) {
  if (isTransitioning) return;
  isTransitioning = true;

  slides.forEach((s, i) => {
    s.classList.remove("active");
    s.style.transform = `translateX(${(i - index) * 100}%)`;
    s.style.opacity = i === index ? "1" : "0";
  });

  dots.forEach((d, i) => d.classList.toggle("active", i === index));
  currentIndex = index;

  setTimeout(() => {
    slides[index].style.transform = "translateX(0)";
    slides[index].style.opacity = "1";
    isTransitioning = false;
  }, 50);
}

function nextSlide() {
  const next = (currentIndex + 1) % testimonials.length;
  showSlide(next);
}

function prevSlide() {
  const prev = (currentIndex - 1 + testimonials.length) % testimonials.length;
  showSlide(prev);
}

function startAutoSlide() {
  stopAutoSlide();
  autoSlideInterval = setInterval(nextSlide, CAROUSEL_INTERVAL);
}

function stopAutoSlide() {
  clearInterval(autoSlideInterval);
  autoSlideInterval = null;
}

prevBtn.addEventListener("click", () => { prevSlide(); startAutoSlide(); });
nextBtn.addEventListener("click", () => { nextSlide(); startAutoSlide(); });
dots.forEach((dot, i) => dot.addEventListener("click", () => { showSlide(i); startAutoSlide(); }));

// Swipe support
let touchStartX = 0;
carousel.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
carousel.addEventListener("touchend", (e) => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextSlide();
    else prevSlide();
    startAutoSlide();
  }
});

// Keyboard support
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") { nextSlide(); startAutoSlide(); }
  else if (e.key === "ArrowRight") { prevSlide(); startAutoSlide(); }
});

// Pause on hover/focus
carousel.addEventListener("mouseenter", stopAutoSlide);
carousel.addEventListener("mouseleave", startAutoSlide);
carousel.addEventListener("focusin", stopAutoSlide);
carousel.addEventListener("focusout", startAutoSlide);

// Pause when tab is hidden
document.addEventListener("visibilitychange", () => {
  document.hidden ? stopAutoSlide() : startAutoSlide();
});

// Respect prefers-reduced-motion
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (prefersReducedMotion.matches) {
  slides.forEach((s) => {
    s.style.transition = "none";
    s.style.transform = "translateX(0)";
  });
  showSlide(0);
} else {
  slides[0].style.opacity = "1";
  startAutoSlide();
}

// Escape helper for JSX-like templates
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}