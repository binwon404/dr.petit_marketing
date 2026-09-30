(async () => {
  const sb = window.sb;
  const LAST_KEY = 'mkboard-last-account';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const list = document.getElementById('acct-list');
  const pw = document.getElementById('pw');
  const err = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  function fail(msg) {
    err.textContent = msg;
    err.hidden = false;
    pw.value = '';
    pw.focus();
  }

  const { data: accounts, error } = await sb.rpc('login_accounts');
  if (error || !accounts?.length) {
    list.innerHTML = '<p class="empty">계정 목록을 불러오지 못했어요. 새로고침해 주세요.</p>';
    btn.disabled = true;
    return;
  }

  let last = '';
  try { last = localStorage.getItem(LAST_KEY) ?? ''; } catch (e) { /* 마지막 계정 기억은 편의 기능 */ }
  const picked = accounts.some((a) => a.login_id === last) ? last : accounts[0].login_id;
  list.innerHTML = accounts.map((a) => `
    <label class="acct">
      <input type="radio" name="acct" value="${esc(a.login_id)}"${a.login_id === picked ? ' checked' : ''}>
      <strong>${esc(a.name)}</strong>
    </label>`).join('');

  pw.addEventListener('input', () => {
    pw.value = pw.value.replace(/\D/g, '').slice(0, 4);
    err.hidden = true;
  });

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = new FormData(e.target).get('acct');
    if (pw.value.length < 4) return fail('비밀번호 숫자 4자리를 입력해 주세요.');
    btn.disabled = true;
    try {
      // 4자리는 서버에서 확인 (10번 틀리면 10분 잠금) → 맞으면 실제 접속
      const { data: gate, error: gateErr } = await sb.rpc('pin_login', { p_login: id, p_pin: pw.value });
      if (gateErr) return fail('접속하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      if (!gate.ok) {
        if (gate.reason === 'locked') {
          return fail(`비밀번호를 10번 틀려 잠겼어요. ${Math.ceil(gate.retry_seconds / 60)}분 뒤에 다시 시도해 주세요.`);
        }
        return fail(`비밀번호가 맞지 않아요.${gate.remaining <= 3 ? ` ${gate.remaining}번 더 틀리면 10분 동안 잠겨요.` : ' 다시 확인해 주세요.'}`);
      }
      const { error: signErr } = await sb.auth.signInWithPassword({ email: gate.email, password: gate.password });
      if (signErr) return fail('접속하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      try { localStorage.setItem(LAST_KEY, id); } catch (e2) { /* 편의 기능 */ }
      location.href = 'dashboard.html#home';
    } finally {
      btn.disabled = false;
    }
  });
})();
