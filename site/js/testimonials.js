// "قالوا عن المعهد" — testimonial carousel
// 10 people from ROADMAP §3.3 in order. Static data, no DB needed.
// Auto-advances every 15s, supports dots, swipe, keyboard arrows.

const CAROUSEL_INTERVAL = 15_000; // ms

const testimonials = [
  {
    name: "الأنبا مقار",
    role: "أسقف الشرقية ومدينة العاشر",
    text: "المعهد هنا فتح مجال قدام أسر كتير إنها تقرأ الكتاب المقدس وتفهم عهد قديم وعهد جديد",
  },
  {
    name: "القس جوارجيوس القمص فيلبس",
    role: "مدير معهد في اتشوب",
    text: "الناس لقت بيئة خصبة إنهم يزهروا فيها ويتعلموا حاجات جديدة، ويبقى عندنا ناس دارسة الكتاب المقدس بصورة دقيقة جداً.",
  },
  {
    name: "القس قزمان عياد",
    role: "أحد أعضاء هيئة التدريس",
    text: "الفكرة في المعهد إن الواحد يدرس دراسة أكاديمية علمية، ويدرس بعمق الكتاب المقدس، علشان الكلمة تثبت فيه.",
  },
  {
    name: "مينا جيد",
    role: "أخد خريجي المعهد",
    text: "أنا من أكتر الناس اللي مبسوطة جداً لوجودي في المعهد، وإني استفدت منه استفادة كبيرة أوي. وعمل سبوت على حاجات كتيرة أوي كانت غايبة عننا في الكتاب المقدس.",
  },
  {
    name: "شريف شوقي",
    role: "أحد خريجي المعهد",
    text: "بصراحة، أنا كنت مبسوط جدًا بالمعهد، لدرجة إني كان كل يوم أحد بالنسبة لي عيد؛ بتعلم حاجة جديدة، بدرس حاجة جديدة، وبستفيد حاجة جديدة، مش مجرد معلومات، لأ، حاجة بتفيدني وتبنيني روحياً."
    },
  {
    name: "رانيا إيراد",
    role: "إحدى خريجات المعهد",
    text: "فرق كتير جدًا في القراءة بعد ما أخدنا المعهد. أخدنا الخلفية التاريخية والخلفية الجغرافية، فلما بنيجي نقرأ السفر اللي كنا بنقرأه قبل كده، لأ، إحنا فاهمين السفر وعايشين فيه.",
  },
  {
    name: "روماني عادل",
    role: "أحد خريجي المعهد",
    text: "قبل الدراسة كنا بنقرأ الكتاب المقدس عادي جدًا، ما بنعرفش نطلع منه العقيدة. إنما بعد دراسة المعهد، كل حاجة وضحت معانا، والعقيدة بقت واضحة من العهد القديم للعهد الجديد.",
  },
  {
    name: "كيرلس رؤوف",
    role: "أحد خريجي المعهد",
    text: "بعد ما درسنا سفر دانيال في المعهد، فرق معانا؛ بقت لنا رؤية أوضح، بقينا فاهمين التاريخ بتاعه، وفاهمين إنه كان بيتنبأ بكل الممالك اللي جت بعد كده.",
  },
  {
    name: "ماريان ملطي",
    role: "إحدى خريجات المعهد",
    text: "فرق معانا إن لما بتعرف الظروف التاريخية اللي حصل فيها الجزء ده من الكتاب المقدس، بتبتدي تفهمه بشكل أعمق وبشكل أفضل.",
  },
  {
    name: "ماركو منير",
    role: "أحد خريجي المعهد",
    text: "من أكتر المحاضرات اللي أنا كنت مبسوط بيها بصراحة، خيمة الاجتماع؛ اتقدمت لنا بشكل مبسط ورهيب، يوصل لكل الناس، حتى لو طفل هيفهم المعلومة كويس جداً.",
  },
];

// Escape helper
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── DOM refs ───────────────────────────────────────────────────────────────
const container = document.getElementById("testimonials");
if (!container) throw new Error("missing #testimonials");

const track = document.createElement("div");
track.className = "testimonials-track";

const slides = testimonials.map((t) => {
  const slide = document.createElement("div");
  slide.className = "testimonial-slide";
  slide.innerHTML = `
    <div class="quote-mark">"</div>
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

const dots = testimonials.map((_, i) => {
  const dot = document.createElement("button");
  dot.className = "testimonial-dot" + (i === 0 ? " active" : "");
  dot.setAttribute("aria-label", `الشهادة ${i + 1}`);
  nav.appendChild(dot);
  return dot;
});

const carousel = document.createElement("div");
carousel.className = "testimonials-carousel";
carousel.appendChild(track);
carousel.appendChild(nav);
container.appendChild(carousel);

// ── Carousel logic ─────────────────────────────────────────────────────────
let currentIndex = 0;
let autoSlideInterval = null;
let isTransitioning = false;
const isMobile = () => window.matchMedia("(max-width: 480px)").matches;

function showSlide(index) {
  if (isTransitioning) return;
  isTransitioning = true;

  slides.forEach((s, i) => {
    s.classList.remove("active");
    if (isMobile()) {
      // على الموبايل: الشريحة النشطة تكون relative والباقي مخفي
      s.style.position = i === index ? "relative" : "absolute";
      s.style.opacity = i === index ? "1" : "0";
      s.style.visibility = i === index ? "visible" : "hidden";
    } else {
      s.style.transform = `translateX(${(i - index) * 100}%)`;
      s.style.opacity = i === index ? "1" : "0";
      s.style.visibility = "";
    }
  });

  dots.forEach((d, i) => d.classList.toggle("active", i === index));
  currentIndex = index;

  setTimeout(() => {
    if (isMobile()) {
      slides[index].style.position = "relative";
      slides[index].style.opacity = "1";
      slides[index].style.visibility = "visible";
    } else {
      slides[index].style.transform = "translateX(0)";
      slides[index].style.opacity = "1";
    }
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
  slides[0].classList.add("active");
  startAutoSlide();
}
