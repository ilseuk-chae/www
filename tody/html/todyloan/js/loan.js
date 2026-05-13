/* ========================================
   토디론 - loan.js
   역할: FAQ 토글 + 대출 계산기 기능
   ======================================== */

// ── FAQ 아코디언 ──────────────────────────
/**
 * 클릭한 FAQ 항목을 열고, 나머지는 닫는다.
 * @param {HTMLElement} el - 클릭된 .faq-q 요소
 */
function toggleFaq(el) {
  const allQ = document.querySelectorAll('.faq-q');
  const allA = document.querySelectorAll('.faq-a');
  const thisA = el.nextElementSibling;

  // 현재 항목 외 모두 닫기
  allQ.forEach(q => { if (q !== el) q.classList.remove('active'); });
  allA.forEach(a => { if (a !== thisA) a.classList.remove('open'); });

  // 현재 항목 토글
  el.classList.toggle('active');
  thisA.classList.toggle('open');
}

// ── 대출 계산기 ───────────────────────────
const loanAmountEl = document.getElementById('loanAmount');
const loanTermEl   = document.getElementById('loanTerm');
const loanRateEl   = document.getElementById('loanRate');

/**
 * 숫자를 한국식 천 단위 구분 포맷으로 반환한다.
 * @param {number} n
 * @returns {string}
 */
function formatNum(n) {
  return Math.round(n).toLocaleString('ko-KR');
}

/**
 * 슬라이더 값을 읽어 월 납입금·총 상환액·총 이자를 계산하고 화면에 반영한다.
 * 계산식: 원리금균등분할상환 (PMT)
 *   monthly = P * r * (1+r)^n / ((1+r)^n - 1)
 */
function calcLoan() {
  const amount  = parseFloat(loanAmountEl.value) * 10000;   // 만원 → 원
  const term    = parseInt(loanTermEl.value);                // 개월
  const annRate = parseFloat(loanRateEl.value);              // 연 %
  const rate    = annRate / 100 / 12;                        // 월 이율

  const monthly = rate === 0
    ? amount / term
    : amount * rate * Math.pow(1 + rate, term) / (Math.pow(1 + rate, term) - 1);

  const total    = monthly * term;
  const interest = total - amount;

  // 슬라이더 옆 표시값 업데이트
  document.getElementById('amountDisplay').textContent = formatNum(amount / 10000) + '만원';
  document.getElementById('termDisplay').textContent   = term + '개월';
  document.getElementById('rateDisplay').textContent   = annRate.toFixed(1) + '%';

  // 결과 패널 업데이트
  document.getElementById('monthlyPay').innerHTML      = formatNum(monthly) + '<span>원</span>';
  document.getElementById('summaryAmount').textContent = formatNum(amount / 10000) + '만원';
  document.getElementById('summaryTerm').textContent   = term + '개월';
  document.getElementById('summaryRate').textContent   = annRate.toFixed(1) + '%';
  document.getElementById('summaryTotal').textContent  = formatNum(total) + '원';
  document.getElementById('summaryInterest').textContent = formatNum(interest) + '원';
}

// 슬라이더 이벤트 등록 + 초기 계산
loanAmountEl.addEventListener('input', calcLoan);
loanTermEl.addEventListener('input', calcLoan);
loanRateEl.addEventListener('input', calcLoan);
calcLoan();
