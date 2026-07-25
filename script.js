/* ============================================================
   SetScape — Core Script
   ============================================================ */

/* ---------- Theme (dark/light) ---------- */
(function initTheme() {
  const saved = localStorage.getItem('setscape-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('setscape-theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.innerHTML = theme === 'dark' ? SUN_ICON : MOON_ICON;
}

const SUN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>';

document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon(document.documentElement.getAttribute('data-theme'));
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
});

/* ---------- Navbar show/hide + reading progress ---------- */
(function initScrollChrome() {
  const navbar = () => document.getElementById('navbar');
  const progressBar = () => document.getElementById('reading-progress');
  const backToTop = () => document.getElementById('back-to-top');
  let lastY = 0;

  function onScroll() {
    const y = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
    const pb = progressBar();
    if (pb) pb.style.width = pct + '%';

    const nav = navbar();
    if (nav) {
      if (y > 400) nav.classList.add('visible'); else nav.classList.remove('visible');
    }
    const btt = backToTop();
    if (btt) {
      if (y > window.innerHeight * 1.2) btt.classList.add('visible'); else btt.classList.remove('visible');
    }
    lastY = y;
    localStorage.setItem('setscape-scrollpos', String(y));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('DOMContentLoaded', onScroll);
})();

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  closeChapterDropdown();
}

/* ---------- Chapter dropdown ---------- */
function toggleChapterDropdown() {
  const dd = document.getElementById('chapter-dropdown');
  if (dd) dd.classList.toggle('open');
}
function closeChapterDropdown() {
  const dd = document.getElementById('chapter-dropdown');
  if (dd) dd.classList.remove('open');
}
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('chapter-menu-wrap');
  if (wrap && !wrap.contains(e.target)) closeChapterDropdown();
});

/* ---------- Section highlighting (active chapter in nav) ---------- */
(function initSectionObserver() {
  document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section.chapter[id]');
    const links = document.querySelectorAll('#chapter-dropdown a');
    if (!sections.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => observer.observe(s));
  });
})();

/* ---------- Scroll reveal ---------- */
(function initReveal() {
  document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(i => observer.observe(i));
  });
})();

/* ---------- Keyboard shortcuts ---------- */
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === '/') {
    e.preventDefault();
    const search = document.getElementById('search-input');
    if (search) { document.getElementById('search-modal').classList.add('open'); search.focus(); }
  }
  if (e.key === 'Escape') {
    closeChapterDropdown();
    const sm = document.getElementById('search-modal');
    if (sm) sm.classList.remove('open');
  }
});

/* ---------- Set utilities (shared by all widgets) ---------- */
function parseSet(str) {
  if (!str) return [];
  return [...new Set(str.split(',').map(s => s.trim()).filter(s => s.length))];
}
function formatSet(arr) {
  if (!arr.length) return '∅';
  return '{ ' + arr.join(', ') + ' }';
}
function union(a, b) { return [...new Set([...a, ...b])]; }
function intersection(a, b) { return a.filter(x => b.includes(x)); }
function difference(a, b) { return a.filter(x => !b.includes(x)); }
function symmetricDifference(a, b) { return [...difference(a, b), ...difference(b, a)]; }
function isSubset(a, b) { return a.every(x => b.includes(x)); }
function isEqual(a, b) { return isSubset(a, b) && isSubset(b, a); }
function powerSet(arr) {
  let result = [[]];
  for (const el of arr) {
    result = result.concat(result.map(sub => [...sub, el]));
  }
  return result;
}
function cartesianProduct(a, b) {
  const pairs = [];
  for (const x of a) for (const y of b) pairs.push('(' + x + ', ' + y + ')');
  return pairs;
}

/* ---------- Progress / badge tracking (localStorage) ---------- */
const SetScapeProgress = {
  key: 'setscape-progress',
  get() {
    try { return JSON.parse(localStorage.getItem(this.key)) || {}; }
    catch (e) { return {}; }
  },
  markComplete(chapterId) {
    const data = this.get();
    data[chapterId] = true;
    localStorage.setItem(this.key, JSON.stringify(data));
    this.updateRing();
  },
  isComplete(chapterId) { return !!this.get()[chapterId]; },
  totalChapters: 9, // Ch.1 through Ch.9 carry quizzes
  updateRing() {
    const data = this.get();
    const done = Object.keys(data).filter(k => data[k]).length;
    const pct = Math.min(100, (done / this.totalChapters) * 100);
    const ring = document.getElementById('progress-ring-fill');
    if (ring) {
      const circumference = 2 * Math.PI * 15;
      ring.style.strokeDasharray = circumference;
      ring.style.strokeDashoffset = circumference - (pct / 100) * circumference;
    }
  }
};
document.addEventListener('DOMContentLoaded', () => SetScapeProgress.updateRing());

/* ---------- Quiz engine (generic, reusable per chapter) ---------- */
function initQuiz(containerId, chapterId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const questions = container.querySelectorAll('.quiz-question');
  let answeredCount = 0;

  questions.forEach(q => {
    const options = q.querySelectorAll('.quiz-option');
    const correctIndex = parseInt(q.dataset.correct, 10);
    options.forEach((opt, idx) => {
      opt.addEventListener('click', () => {
        if (opt.disabled) return;
        options.forEach(o => o.disabled = true);
        if (idx === correctIndex) {
          opt.classList.add('correct');
        } else {
          opt.classList.add('incorrect');
          options[correctIndex].classList.add('correct');
        }
        const explain = q.querySelector('.quiz-explain');
        if (explain) explain.classList.add('show');
        answeredCount++;
        if (answeredCount === questions.length) {
          SetScapeProgress.markComplete(chapterId);
          const badge = container.querySelector('.badge');
          if (badge) badge.classList.add('show');
        }
      });
    });
  });
}

/* ---------- Flashcard flip ---------- */
function initFlashcards(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.flashcard').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('flipped'));
  });
}
