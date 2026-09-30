(() => {
  const DESC = { ceo: '전체 팀 보기 · 보기 전용', admin: '전체 팀 보기 · 설정 관리', team: '자기 팀만 보기 · 입력' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  document.getElementById('acct-list').innerHTML = window.DEMO_DATA.accounts.map((a, i) => `
    <label class="acct">
      <input type="radio" name="acct" value="${esc(a.id)}"${i === 0 ? ' checked' : ''}>
      <span><strong>${esc(a.name)}</strong><small>${DESC[a.role]}</small></span>
    </label>`).join('');

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = new FormData(e.target).get('acct');
    location.href = `dashboard.html?as=${encodeURIComponent(id)}#home`;
  });
})();
