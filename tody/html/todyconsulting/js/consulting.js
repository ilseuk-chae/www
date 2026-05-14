/* ===== CUSTOM ALERT ===== */
function customAlert(msg, callback) {
  let overlay = document.getElementById('customAlertOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'customAlertOverlay';
    overlay.innerHTML =
      '<div class="ca-box">' +
        '<p class="ca-msg"></p>' +
        '<button class="ca-btn">확인</button>' +
      '</div>';
    document.body.appendChild(overlay);

    const close = function () {
      overlay.classList.remove('show');
      if (typeof overlay._cb === 'function') overlay._cb();
      overlay._cb = null;
    };
    overlay.querySelector('.ca-btn').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === 'Escape') && overlay.classList.contains('show')) close();
    });
  }
  overlay.querySelector('.ca-msg').textContent = msg;
  overlay._cb = callback || null;
  overlay.classList.add('show');
  overlay.querySelector('.ca-btn').focus();
}

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

/* ===== SCROLL FADE-UP ===== */
const fadeTargets = document.querySelectorAll(
  '.about-card, .target-item, .pd-item, .expert-card, .expert-notice, .contact-info, .contact-form, .flow-row, .flow-box'
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
  e.preventDefault();
  const form = this;

  const purpose  = form.purpose.value.trim();
  const location = form.location.value.trim();
  const phone    = form.phone.value.trim();
  const name     = form.name.value.trim();
  const agree    = form.agree.checked;

  const validPurposes = ['feasibility', 'devpermit', 'district', 'tourism', 'housing', 'industrial', 'urban', 'other'];
  if (!validPurposes.includes(purpose)) { customAlert('개발 목적을 선택해주세요.',   () => form.purpose.focus());  return; }
  if (!location) { customAlert('소재지를 입력해주세요.',   () => form.location.focus()); return; }
  if (!phone)    { customAlert('연락처를 입력해주세요.',   () => form.phone.focus());   return; }
  if (!name)     { customAlert('성명을 입력해주세요.',     () => form.name.focus());    return; }
  if (!agree)    { customAlert('개인정보 수집 및 이용에 동의해주세요.'); return; }

  const btn = form.querySelector('.btn-submit');
  const successEl = document.getElementById('formSuccess');
  btn.disabled = true;
  btn.textContent = '전송 중...';

  try {
    const fd = new FormData(form);
    const res = await fetch('/front/back/todyconsulting/inquiry_register.php', {
      method: 'POST',
      body: fd
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && (data.statusCode === 200 || data.message === 'SUCCESS')) {
      successEl.querySelector('span').textContent =
        '✅ 신청이 접수되었습니다. 내부 검토 후 컨설팅 진행 관련 개별 연락드리겠습니다!';
      successEl.classList.add('show');
      form.reset();
      setTimeout(() => successEl.classList.remove('show'), 6000);
    } else {
      const msg = (data && data.message) ? data.message : '전송에 실패했습니다. 잠시 후 다시 시도해주세요.';
      customAlert(msg);
    }
  } catch (err) {
    console.error(err);
    customAlert('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  } finally {
    btn.textContent = '신청서 제출하기';
    btn.disabled = false;
  }
});

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
sections.forEach(s =>
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
