/* ===== HEADER SCROLL ===== */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
});

/* ===== MOBILE HAMBURGER ===== */
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
hamburger.addEventListener('click', () => {
  nav.classList.toggle('open');
});
nav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => nav.classList.remove('open'));
});

/* ===== FAQ ACCORDION ===== */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* ===== SCROLL FADE-UP ===== */
const fadeTargets = document.querySelectorAll(
  '.feature-card, .about-card, .target-card, .pd-item, .benefit-card, .faq-item, .contact-info, .contact-form, .flow-diagram'
);
fadeTargets.forEach((el, i) => {
  el.classList.add('fade-up');
  el.style.transitionDelay = `${(i % 4) * 70}ms`;
});

const fadeObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); fadeObs.unobserve(e.target); }
  });
}, { threshold: 0.1 });
fadeTargets.forEach(el => fadeObs.observe(el));

/* ===== CONTACT FORM ===== */
document.getElementById('contactForm').addEventListener('submit', async function (e) {
  console.log('[contactForm] submit fired');  // 이 줄 추가
  e.preventDefault();
  const form = this;
  const btn = form.querySelector('.btn-submit');
  const successEl = document.getElementById('formSuccess');
  btn.disabled = true;
  btn.textContent = '전송 중...';

  try {
    const fd = new FormData(form);
    // checkbox "agree"는 체크 시에만 전송됨 (서버에서 isset으로 판단)

    const res = await fetch('/front/back/todypurchas/inquiry_register.php', {
      method: 'POST',
      body: fd
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && (data.statusCode === 200 || data.message === 'SUCCESS')) {
      successEl.querySelector('span').textContent =
        '✅ 신청이 접수되었습니다. 담당자가 빠르게 확인 후 연락드리겠습니다!';
      successEl.classList.add('show');
      form.reset();
      // 첨부 리스트 초기화
      const list = document.getElementById('attachmentList');
      if (list) list.innerHTML = '';
      setTimeout(() => successEl.classList.remove('show'), 6000);
    } else {
      const msg = (data && data.message) ? data.message : '전송에 실패했습니다. 잠시 후 다시 시도해주세요.';
      alert(msg);
    }
  } catch (err) {
    console.error(err);
    alert('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  } finally {
    btn.textContent = '신청서 제출하기';
    btn.disabled = false;
  }
});

/* ===== ATTACHMENT LIST ===== */
(function () {
  const input = document.getElementById('attachment');
  const list = document.getElementById('attachmentList');
  if (!input || !list) return;

  let files = [];

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function syncInput() {
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    input.files = dt.files;
  }

  function render() {
    list.innerHTML = '';
    files.forEach((f, idx) => {
      const li = document.createElement('li');
      li.className = 'attachment-item';
      li.innerHTML = `
        <span class="attachment-name">${f.name}</span>
        <span class="attachment-size">(${formatSize(f.size)})</span>
        <button type="button" class="attachment-remove" aria-label="삭제">×</button>
      `;
      li.querySelector('.attachment-remove').addEventListener('click', () => {
        files.splice(idx, 1);
        syncInput();
        render();
      });
      list.appendChild(li);
    });
  }

  input.addEventListener('change', (e) => {
    const incoming = Array.from(e.target.files);
    incoming.forEach(nf => {
      if (!files.some(f => f.name === nf.name && f.size === nf.size && f.lastModified === nf.lastModified)) {
        files.push(nf);
      }
    });
    syncInput();
    render();
  });
})();

/* ===== PHONE FORMAT ===== */
document.getElementById('phone').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '');
  if (v.length <= 3) this.value = v;
  else if (v.length <= 7) this.value = v.slice(0, 3) + '-' + v.slice(3);
  else this.value = v.slice(0, 3) + '-' + v.slice(3, 7) + '-' + v.slice(7, 11);
});

/* ===== ACTIVE NAV ON SCROLL ===== */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('#nav ul li a');
new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const link = document.querySelector(`#nav a[href="#${e.target.id}"]`);
      if (link) link.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' }).observe && sections.forEach(s =>
  new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const link = document.querySelector(`#nav a[href="#${e.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' }).observe(s)
);
