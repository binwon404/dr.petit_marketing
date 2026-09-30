(async () => {
  const sb = window.sb;
  const BUCKET = 'ad-images';

  const GRADES = {
    best: { label: '최상 - 지속유지', short: '최상' },
    good: { label: '양호 - 관망필요', short: '양호' },
    bad: { label: '미흡 - 교체필요', short: '미흡' },
    hold: { label: '판단 보류', short: '보류' },
  };
  const GRADE_KEYS = ['best', 'good', 'bad', 'hold'];
  const STATUS = { running: '진행중', paused: '일시정지', ended: '종료' };
  const OBJECTIVE = { sales: '판매', traffic: '유입' };
  const SYMBOL = { KRW: '₩', USD: '$', JPY: '¥', CNY: 'CN¥' };
  const CURRENCIES = [['KRW', '원 (KRW)'], ['USD', '달러 (USD)'], ['JPY', '엔 (JPY)'], ['CNY', '위안 (CNY)']];
  const IMAGE_TYPES = ['image/jpeg', 'image/png'];

  const $ = (sel, root = document) => root.querySelector(sel);
  const main = $('#main');
  const dlg = $('#dlg');

  // 로그인한 계정과 화면 데이터 — 맨 아래 "시작"에서 채움
  let account;
  let isTeam = false;
  let canEdit = false;
  let canSeeLogs = false;
  let canSettings = false;
  let state = null;
  let pickedMonth = null;
  let currentPage = 'home';
  let saving = 0;
  let filters = { team: '', media: '', grade: '' };
  let logFilter = '';
  let pendingImage = null;
  let formImage = '';
  const urlCache = new Map();

  // ---------- 형식 ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const teamName = (id) => state.teams.find((t) => t.id === id)?.name ?? '관리자';
  const mediaName = (id) => state.media.find((m) => m.id === id)?.name ?? id;
  const cardLabel = (id) => {
    const c = state.cards.find((x) => x.id === id);
    return c ? `${c.name} ****${c.last4}` : '미지정';
  };
  const hasCard = (ad) => state.cards.some((c) => c.id === ad.card);
  // 카드가 삭제됐거나 없는 광고: 종료된 광고가 아니면 빨간 글씨로 지정 요청
  const cardCell = (ad) => (hasCard(ad) ? esc(cardLabel(ad.card))
    : ad.status === 'ended' ? '<span class="muted">미지정</span>' : '<span class="need-card">카드를 지정해 주세요</span>');
  const num = (v) => Number(v || 0).toLocaleString('ko-KR');
  const money = (v, cur) =>
    `${SYMBOL[cur] ?? ''}${Number(v || 0).toLocaleString('ko-KR', { maximumFractionDigits: cur === 'USD' ? 2 : 0 })}`;
  const won = (v) => money(Math.round(v), 'KRW');
  const krw = (v, cur) => v * (state.settings.rates[cur] ?? 1);
  const pct = (v) => `${(v * 100).toFixed(1)}%`;

  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const today = () => ymd(new Date());
  const thisMonth = () => today().slice(0, 7);
  const localStamp = (iso) => { const d = new Date(iso); return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  function addDays(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    return ymd(new Date(y, m - 1, d + n));
  }
  function mondayOf(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return addDays(iso, -((new Date(y, m - 1, d).getDay() + 6) % 7));
  }
  const md = (iso) => { const [, m, d] = iso.split('-'); return `${Number(m)}/${Number(d)}`; };
  const weekLabel = (start) => `${md(start)}~${md(addDays(start, 6))}`;
  const monthText = (ym) => { const [y, m] = ym.split('-'); return `${y}년 ${Number(m)}월`; };
  const monthLabel = () => monthText(state.reportMonth);
  const monthWord = () => (state.reportMonth === thisMonth() ? '이번 달' : `${Number(state.reportMonth.split('-')[1])}월`);
  const stampLabel = (at) => { const [d, t] = at.split('T'); return `${md(d)} ${t}`; };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)));

  // ---------- 데이터 불러오기 ----------
  const must = (res) => { if (res.error) throw res.error; return res.data; };

  async function fetchAll(table, columns, order) {
    const rows = [];
    for (let from = 0; ; from += 1000) {
      let q = sb.from(table).select(columns);
      order.forEach((col) => { q = q.order(col); });
      const data = must(await q.range(from, from + 999));
      rows.push(...data);
      if (data.length < 1000) return rows;
    }
  }

  // 비공개 보관함이라 이미지마다 1시간짜리 주소를 받아 씀 (받은 주소는 50분 동안 재사용)
  async function signImages(paths) {
    const now = Date.now();
    const need = paths.filter((p) => !(urlCache.get(p)?.exp > now));
    if (!need.length) return;
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(need, 3600);
    if (error) return;
    data.forEach((d) => { if (d.signedUrl) urlCache.set(d.path, { url: d.signedUrl, exp: now + 50 * 60 * 1000 }); });
  }

  async function loadAll() {
    const [teams, media, settings, cards, ads, perf, logs, accounts] = await Promise.all([
      sb.from('teams').select('id, name').order('sort_order').then(must),
      sb.from('media').select('id, name, roas_best, roas_good, cpc_best, cpc_good').order('sort_order').then(must),
      sb.from('settings').select('hold_min_clicks, rate_usd, rate_jpy, rate_cny').single().then(must),
      sb.from('cards').select('id, name, last4').order('created_at').then(must),
      fetchAll('ads', 'id, team_id, media_id, name, objective, status, start_date, end_date, currency, daily_budget, monthly_budget, card_id, image_path', ['created_at', 'id']),
      fetchAll('ad_performance', 'ad_id, week_start, spend, impressions, clicks, conversions, revenue, author', ['id']),
      canSeeLogs ? sb.from('change_logs').select('at, team_id, who, action, target, detail')
        .order('at', { ascending: false }).order('id', { ascending: false }).limit(300).then(must) : [],
      canSettings ? sb.rpc('login_accounts').then(must) : [],
    ]);
    await signImages(ads.map((a) => a.image_path).filter(Boolean));

    const perfOf = new Map();
    perf.forEach((p) => {
      if (!perfOf.has(p.ad_id)) perfOf.set(p.ad_id, []);
      perfOf.get(p.ad_id).push({
        start: p.week_start, spend: Number(p.spend), impressions: Number(p.impressions), clicks: Number(p.clicks),
        conversions: Number(p.conversions), revenue: Number(p.revenue), author: p.author,
      });
    });
    // 볼 수 있는 달: 성과가 입력된 달 + 이번 달. 이번 달 성과가 아직 없으면 가장 최근 달부터 보여 줌
    const dataMonths = [...new Set(perf.map((p) => p.week_start.slice(0, 7)))].sort().reverse();
    const months = [...new Set([thisMonth(), ...dataMonths])].sort().reverse();
    const reportMonth = months.includes(pickedMonth) ? pickedMonth
      : dataMonths.includes(thisMonth()) ? thisMonth() : dataMonths[0] ?? thisMonth();

    return {
      months,
      reportMonth,
      latestWeek: addDays(mondayOf(today()), -7),
      teams,
      media: media.map((m) => ({ id: m.id, name: m.name })),
      settings: {
        rates: { KRW: 1, USD: Number(settings.rate_usd), JPY: Number(settings.rate_jpy), CNY: Number(settings.rate_cny) },
        holdMinClicks: settings.hold_min_clicks,
        thresholds: Object.fromEntries(media.map((m) => [m.id, {
          roasBest: Number(m.roas_best), roasGood: Number(m.roas_good), cpcBest: Number(m.cpc_best), cpcGood: Number(m.cpc_good),
        }])),
      },
      cards,
      accounts,
      ads: ads.map((a) => ({
        id: a.id, team: a.team_id, media: a.media_id, name: a.name, objective: a.objective, status: a.status,
        start: a.start_date, end: a.end_date ?? '', currency: a.currency,
        daily: Number(a.daily_budget), monthly: Number(a.monthly_budget), card: a.card_id ?? '',
        imagePath: a.image_path ?? '', image: urlCache.get(a.image_path)?.url ?? '',
        perf: perfOf.get(a.id) ?? [],
      })),
      logs: logs.map((l) => ({ at: localStamp(l.at), team: l.team_id, who: l.who, action: l.action, target: l.target, detail: l.detail })),
    };
  }

  async function reload() { state = await loadAll(); }

  // 저장 작업 공통: 버튼 잠금 + 실패 안내
  async function run(form, work, failMsg = '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.') {
    const btns = form ? [...form.querySelectorAll('button')] : [];
    btns.forEach((b) => { b.disabled = true; });
    saving += 1;
    try {
      await work();
      return true;
    } catch (e) {
      console.error(e);
      toast(e?.code === '42501' ? '이 계정으로는 할 수 없는 작업이에요.' : failMsg);
      return false;
    } finally {
      saving -= 1;
      btns.forEach((b) => { b.disabled = false; });
    }
  }

  // ---------- 계산 · 판정 ----------
  function sumPerf(list) {
    return list.reduce((s, p) => ({
      spend: s.spend + Number(p.spend), impressions: s.impressions + Number(p.impressions), clicks: s.clicks + Number(p.clicks),
      conversions: s.conversions + Number(p.conversions), revenue: s.revenue + Number(p.revenue),
    }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 });
  }
  function calc(s) {
    return {
      cpc: s.clicks ? s.spend / s.clicks : null,
      ctr: s.impressions ? s.clicks / s.impressions : null,
      cpa: s.conversions ? s.spend / s.conversions : null,
      roas: s.spend ? s.revenue / s.spend : null,
    };
  }
  const monthList = (ad) => ad.perf.filter((p) => p.start.startsWith(state.reportMonth));

  function grade(ad, list = monthList(ad)) {
    if (!list.length) return { key: 'hold', reason: `${monthWord()} 입력된 성과가 없어요` };
    const s = sumPerf(list);
    const min = state.settings.holdMinClicks;
    if (s.clicks < min) return { key: 'hold', reason: `클릭 ${num(s.clicks)}회 · ${num(min)}회 이상 쌓이면 판정해요` };
    const t = state.settings.thresholds[ad.media];
    const m = calc(s);
    if (ad.objective === 'sales') {
      const r = m.roas;
      const key = r >= t.roasBest ? 'best' : r >= t.roasGood ? 'good' : 'bad';
      return {
        key,
        metric: `ROAS ${r.toFixed(2)}배`,
        reason: `1만 원 써서 ${r.toFixed(1)}만 원 매출 · 기준: 최상 ${t.roasBest}배 이상, 양호 ${t.roasGood}배 이상`,
      };
    }
    const c = krw(m.cpc, ad.currency);
    const key = c <= t.cpcBest ? 'best' : c <= t.cpcGood ? 'good' : 'bad';
    return {
      key,
      metric: `CPC ${won(c)}`,
      reason: `클릭 1번에 약 ${won(c)}${ad.currency !== 'KRW' ? ' (원화 환산)' : ''} · 기준: 최상 ${won(t.cpcBest)} 이하, 양호 ${won(t.cpcGood)} 이하`,
    };
  }

  // 팀 간 차단은 Supabase 권한 규칙(RLS)이 함 — 여기 필터는 화면 정리용
  const visibleAds = () => (isTeam ? state.ads.filter((a) => a.team === account.team) : state.ads);
  function findAd(id) {
    const ad = state.ads.find((a) => a.id === id);
    return ad && (!isTeam || ad.team === account.team) ? ad : null;
  }
  function budgetOf(ads) {
    return ads.reduce((s, ad) => {
      s.budget += krw(ad.monthly, ad.currency);
      s.spend += krw(sumPerf(monthList(ad)).spend, ad.currency);
      return s;
    }, { budget: 0, spend: 0 });
  }

  // ---------- 공통 조각 ----------
  const pill = (g, long = true) => `<span class="pill pill-${g.key}"><i></i>${long ? GRADES[g.key].label : GRADES[g.key].short}</span>`;
  const bar = (v) => `<div class="bar${v > 1 ? ' over' : ''}"><i style="width:${Math.min(v, 1) * 100}%"></i></div>`;
  const opts = (list, value) => list.map(([v, l]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('');
  const filterSelect = (id, allLabel, list, value) => `<select id="${id}" aria-label="${allLabel}"><option value="">${allLabel}</option>${opts(list, value)}</select>`;
  const teamOpts = () => state.teams.map((t) => [t.id, t.name]);
  const mediaOpts = () => state.media.map((m) => [m.id, m.name]);
  const newAdBtn = () => (canEdit ? '<button class="btn" data-act="new-ad">+ 광고 등록</button>' : '');
  const monthSelect = () => (state.months.length > 1
    ? `<select id="f-month" aria-label="볼 달">${opts(state.months.map((m) => [m, monthText(m)]), state.reportMonth)}</select>` : '');
  const headActions = () => `<div class="head-actions">${monthSelect()}${newAdBtn()}</div>`;
  const thumb = (ad) => (ad.image ? `<img class="thumb" src="${esc(ad.image)}" alt="">` : '<span class="thumb none">없음</span>');

  function authorKey() { return `mkboard-author-${account.id}`; }
  function rememberedAuthor() {
    try { return localStorage.getItem(authorKey()) || (account.role === 'admin' ? '관리자' : ''); } catch (e) { return ''; }
  }
  function rememberAuthor(name) {
    const v = name.trim();
    try { localStorage.setItem(authorKey(), v); } catch (e) { /* 이름 기억은 편의 기능 */ }
    return v;
  }

  // ---------- 홈 ----------
  function renderHome() {
    const ads = visibleAds();
    const graded = ads.map((ad) => ({ ad, g: grade(ad) }));
    const counts = Object.fromEntries(GRADE_KEYS.map((k) => [k, 0]));
    graded.forEach(({ g }) => { counts[g.key] += 1; });
    const bad = graded.filter(({ g }) => g.key === 'bad');
    const tot = budgetOf(ads);
    const usage = tot.budget ? tot.spend / tot.budget : 0;

    main.innerHTML = `
      <div class="page-head">
        <div><p class="eyebrow">${monthLabel()} · ${esc(isTeam ? account.name : '전체 팀')}</p><h1>${monthWord()} 광고 현황</h1></div>
        ${headActions()}
      </div>

      <section class="panel budget">
        <div class="budget-top"><span class="label">월 예산 사용</span><span class="budget-pct">${Math.round(usage * 100)}%</span></div>
        <div class="budget-nums"><strong>${won(tot.spend)}</strong><span> / ${won(tot.budget)}</span></div>
        ${bar(usage)}
        <p class="hint">남은 예산 ${won(Math.max(tot.budget - tot.spend, 0))}${ads.some((a) => a.currency !== 'KRW') ? ' · 해외 광고비는 원화로 환산했어요' : ''}</p>
      </section>

      <section class="signals" aria-label="판정별 광고 수">
        ${GRADE_KEYS.map((k) => `
          <button class="signal signal-${k}${k === 'bad' && counts.bad ? ' has' : ''}" data-act="filter-grade" data-grade="${k}">
            <span class="signal-n">${counts[k]}</span><span class="signal-l">${GRADES[k].label}</span>
          </button>`).join('')}
      </section>

      <section class="panel list">
        <div class="panel-head"><h2>교체가 필요한 광고</h2><span class="count">${bad.length}건</span></div>
        ${bad.length ? `<ul class="rows">${bad.map(({ ad, g }) => `
          <li><button class="row" data-act="open-ad" data-id="${ad.id}">
            <span class="row-main"><strong>${esc(ad.name)}</strong><span class="tags">${isTeam ? '' : `<span class="tag">${esc(teamName(ad.team))}</span>`}<span class="tag">${esc(mediaName(ad.media))}</span></span></span>
            <span class="row-side">${g.metric}<span class="sub">${esc(g.reason.split(' · ')[1])}</span></span>
          </button></li>`).join('')}</ul>` : '<p class="empty">교체가 필요한 광고가 없어요</p>'}
      </section>

      ${isTeam ? reminderPanel() : teamCards(graded) + teamPayCards(ads)}`;
  }

  // 대표·관리자용: 팀마다 종료되지 않은 광고에 연결된 결제 카드
  function teamPayCards(ads) {
    return `
      <section class="panel quiet">
        <div class="panel-head"><h2>팀별 결제 카드</h2><span class="hint">종료된 광고는 빼고 보여줘요</span></div>
        <ul class="pay-list">${state.teams.map((t) => {
          const counts = new Map();
          ads.filter((a) => a.team === t.id && a.status !== 'ended')
            .forEach((a) => { const k = hasCard(a) ? a.card : ''; counts.set(k, (counts.get(k) ?? 0) + 1); });
          return `
            <li><span class="pay-team">${esc(t.name)}</span>
              <span class="pay-cards">${[...counts].map(([card, n]) =>
                `<span${card ? '' : ' class="need-card"'}>${card ? esc(cardLabel(card)) : '카드 지정 필요'}<small>광고 ${n}개</small></span>`).join('') || '<span class="muted">연결된 카드 없음</span>'}</span></li>`;
        }).join('')}</ul>
      </section>`;
  }

  function teamCards(graded) {
    return `
      <section>
        <div class="section-head"><h2>팀별 현황</h2></div>
        <div class="team-grid">${state.teams.map((t) => {
          const list = graded.filter(({ ad }) => ad.team === t.id);
          const b = budgetOf(list.map(({ ad }) => ad));
          const c = Object.fromEntries(GRADE_KEYS.map((k) => [k, list.filter(({ g }) => g.key === k).length]));
          return `
            <button class="team-card" data-act="filter-team" data-team="${t.id}">
              <div class="team-top"><strong>${esc(t.name)}</strong><span class="muted">광고 ${list.length}개</span></div>
              <div class="team-money"><span>${won(b.spend)}</span><span class="muted"> / ${won(b.budget)}</span></div>
              ${bar(b.budget ? b.spend / b.budget : 0)}
              <div class="dots">${GRADE_KEYS.filter((k) => c[k]).map((k) => `<span class="dot dot-${k}"><i></i>${GRADES[k].short} ${c[k]}</span>`).join('')}</div>
            </button>`;
        }).join('')}</div>
      </section>`;
  }

  function reminderPanel() {
    const wk = state.latestWeek;
    const missing = visibleAds().filter((a) => a.status === 'running' && a.start <= addDays(wk, 6) && !a.perf.some((p) => p.start === wk));
    return `
      <section class="panel list">
        <div class="panel-head"><h2>지난주(${weekLabel(wk)}) 성과 입력</h2><span class="count">${missing.length ? `${missing.length}건 남음` : '완료'}</span></div>
        ${missing.length ? `<ul class="rows">${missing.map((ad) => `
          <li><button class="row" data-act="perf" data-id="${ad.id}">
            <span class="row-main"><strong>${esc(ad.name)}</strong><span class="tags"><span class="tag">${esc(mediaName(ad.media))}</span></span></span>
            <span class="row-side link">입력하기</span>
          </button></li>`).join('')}</ul>` : '<p class="empty">진행 중인 광고의 성과를 모두 입력했어요</p>'}
      </section>`;
  }

  // ---------- 광고 목록 ----------
  function renderAds() {
    const order = { bad: 0, hold: 1, good: 2, best: 3 };
    let rows = visibleAds().map((ad) => ({ ad, g: grade(ad) }));
    if (filters.team) rows = rows.filter(({ ad }) => ad.team === filters.team);
    if (filters.media) rows = rows.filter(({ ad }) => ad.media === filters.media);
    if (filters.grade) rows = rows.filter(({ g }) => g.key === filters.grade);
    rows.sort((a, b) => order[a.g.key] - order[b.g.key]);
    const hasFilter = filters.team || filters.media || filters.grade;

    main.innerHTML = `
      <div class="page-head">
        <div><p class="eyebrow">${monthLabel()} 누적 기준 · 문제 있는 광고가 위에 와요</p><h1>광고 목록</h1></div>
        ${headActions()}
      </div>
      <div class="filters">
        ${isTeam ? '' : filterSelect('f-team', '모든 팀', teamOpts(), filters.team)}
        ${filterSelect('f-media', '모든 매체', mediaOpts(), filters.media)}
        ${filterSelect('f-grade', '모든 판정', GRADE_KEYS.map((k) => [k, GRADES[k].label]), filters.grade)}
        ${hasFilter ? '<button class="link-btn" data-act="clear-filters">필터 지우기</button>' : ''}
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>판정</th><th>광고</th><th>상태</th><th>${monthWord()} 예산 사용</th><th>결제 카드</th><th>핵심 지표</th></tr></thead>
          <tbody>${rows.map(({ ad, g }) => {
            const s = sumPerf(monthList(ad));
            return `
              <tr data-act="open-ad" data-id="${ad.id}" tabindex="0">
                <td>${pill(g)}</td>
                <td><div class="ad-cell">${thumb(ad)}<div><strong>${esc(ad.name)}</strong><span class="sub">${isTeam ? '' : `${esc(teamName(ad.team))} · `}${esc(mediaName(ad.media))} · ${OBJECTIVE[ad.objective]}</span></div></div></td>
                <td><span class="status status-${ad.status}">${STATUS[ad.status]}</span></td>
                <td class="num">${money(s.spend, ad.currency)}<span class="muted"> / ${money(ad.monthly, ad.currency)}</span>
                  ${bar(ad.monthly ? s.spend / ad.monthly : 0)}<span class="sub">일 예산 ${money(ad.daily, ad.currency)}</span></td>
                <td>${cardCell(ad)}</td>
                <td class="num">${g.metric ?? '<span class="muted">-</span>'}</td>
              </tr>`;
          }).join('') || `<tr><td colspan="6" class="empty">${hasFilter ? '조건에 맞는 광고가 없어요' : '아직 등록된 광고가 없어요'}</td></tr>`}</tbody>
        </table>
      </div>`;
  }

  // ---------- 광고 상세 ----------
  function openAd(id) {
    const ad = findAd(id);
    if (!ad) return;
    const g = grade(ad);
    const c = ad.currency;
    const perf = [...ad.perf].sort((a, b) => b.start.localeCompare(a.start));
    const total = sumPerf(monthList(ad));
    const tm = calc(total);
    const perfRow = (label, p, m, author, cls = '') => `
      <tr class="${cls}"><td>${label}</td><td class="num">${money(p.spend, c)}</td><td class="num">${num(p.impressions)}</td>
        <td class="num">${num(p.clicks)}</td><td class="num">${num(p.conversions)}</td><td class="num">${money(p.revenue, c)}</td>
        <td class="num">${m.cpc != null ? money(m.cpc, c) : '-'}</td><td class="num">${m.ctr != null ? pct(m.ctr) : '-'}</td>
        <td class="num">${p.revenue && m.roas != null ? `${m.roas.toFixed(2)}배` : '-'}</td><td>${esc(author)}</td></tr>`;

    dlg.innerHTML = `
      <div class="dlg-body">
        <div class="dlg-head">
          <div><p class="eyebrow">${esc(teamName(ad.team))} · ${esc(mediaName(ad.media))} · ${OBJECTIVE[ad.objective]} 광고</p><h2>${esc(ad.name)}</h2></div>
          <button type="button" class="icon-btn" data-act="close" aria-label="닫기">×</button>
        </div>
        <div class="grade-box grade-${g.key}">${pill(g)}<p>${esc(g.reason)}</p></div>
        <dl class="info">
          <div><dt>상태</dt><dd>${STATUS[ad.status]}</dd></div>
          <div><dt>기간</dt><dd>${md(ad.start)} ~ ${ad.end ? md(ad.end) : '종료일 없음'}</dd></div>
          <div><dt>일 예산</dt><dd>${money(ad.daily, c)}</dd></div>
          <div><dt>월 예산</dt><dd>${money(ad.monthly, c)}${c !== 'KRW' ? ` <span class="muted">(약 ${won(krw(ad.monthly, c))})</span>` : ''}</dd></div>
          <div><dt>결제 카드</dt><dd>${cardCell(ad)}</dd></div>
        </dl>
        <div class="creative">
          <h3>소재 이미지</h3>
          ${ad.image ? `<img src="${esc(ad.image)}" alt="광고 소재 이미지">` : `
            <div class="creative-empty">
              <p class="empty">등록된 소재 이미지가 없어요</p>
              ${canEdit ? `<button type="button" class="btn ghost" data-act="edit-ad" data-id="${ad.id}">이미지 추가</button>` : ''}
            </div>`}
        </div>
        <h3>주간 성과</h3>
        <div class="table-wrap">
          <table class="table compact">
            <thead><tr><th>기간</th><th>광고비</th><th>노출</th><th>클릭</th><th>전환</th><th>매출</th><th>CPC</th><th>CTR</th><th>ROAS</th><th>입력</th></tr></thead>
            <tbody>${perf.map((p) => perfRow(weekLabel(p.start), p, calc(p), p.author)).join('') || '<tr><td colspan="10" class="empty">아직 입력된 성과가 없어요</td></tr>'}</tbody>
            ${perf.length ? `<tfoot>${perfRow(`${monthLabel().split(' ')[1]} 누적`, total, tm, '', 'total')}</tfoot>` : ''}
          </table>
        </div>
        ${canEdit ? `
          <div class="dlg-actions">
            <button type="button" class="btn ghost" data-act="edit-ad" data-id="${ad.id}">광고 정보 수정</button>
            <button type="button" class="btn" data-act="perf" data-id="${ad.id}">성과 입력</button>
          </div>` : ''}
      </div>`;
    openDialog();
  }

  // ---------- 광고 등록 · 수정 ----------
  function adForm(id) {
    if (!canEdit) return;
    const ad = id ? findAd(id) : null;
    if (id && !ad) return;
    const v = ad ?? {
      team: isTeam ? account.team : state.teams[0].id, media: 'meta', name: '', objective: 'sales', status: 'running',
      start: today(), end: '', currency: 'KRW', daily: '', monthly: '', card: state.cards[0]?.id ?? '', image: '', imagePath: '',
    };
    pendingImage = null;
    formImage = v.image;
    const cardOpts = state.cards.map((c) => [c.id, cardLabel(c.id)]);
    const needPick = !hasCard(v);

    dlg.innerHTML = `
      <form id="ad-form" class="dlg-body form" data-id="${ad ? ad.id : ''}">
        <div class="dlg-head">
          <h2>${ad ? '광고 정보 수정' : '새 광고 등록'}</h2>
          <button type="button" class="icon-btn" data-act="close" aria-label="닫기">×</button>
        </div>
        ${isTeam ? '' : `<label class="field"><span>팀</span><select name="team" required>${opts(teamOpts(), v.team)}</select></label>`}
        <div class="grid2">
          <label class="field"><span>매체</span><select name="media" required>${opts(mediaOpts(), v.media)}</select></label>
          <label class="field"><span>상태</span><select name="status" required>${opts(Object.entries(STATUS), v.status)}</select></label>
        </div>
        <label class="field"><span>광고 이름</span><input name="name" required maxlength="60" value="${esc(v.name)}" placeholder="예: 가을 신제품 수분크림 전환"></label>
        <fieldset class="field">
          <legend>광고 목적</legend>
          <div class="choices">
            <label class="choice"><input type="radio" name="objective" value="sales"${v.objective === 'sales' ? ' checked' : ''}><span><strong>판매</strong>매출이 목표예요. ROAS로 판정해요</span></label>
            <label class="choice"><input type="radio" name="objective" value="traffic"${v.objective === 'traffic' ? ' checked' : ''}><span><strong>유입</strong>방문·상담이 목표예요. CPC로 판정해요</span></label>
          </div>
        </fieldset>
        <div class="grid2">
          <label class="field"><span>시작일</span><input type="date" name="start" required value="${esc(v.start)}"></label>
          <label class="field"><span>종료일 (선택)</span><input type="date" name="end" value="${esc(v.end)}"></label>
        </div>
        <div class="grid3">
          <label class="field"><span>통화</span><select name="currency" required>${opts(CURRENCIES, v.currency)}</select></label>
          <label class="field"><span>일 예산</span><input type="number" name="daily" min="0" step="any" required value="${esc(v.daily)}"></label>
          <label class="field"><span>월 예산</span><input type="number" name="monthly" min="0" step="any" required value="${esc(v.monthly)}"></label>
        </div>
        <label class="field"><span>결제 카드</span>
          <select name="card" ${cardOpts.length ? 'required' : 'disabled'}>${needPick ? `<option value="">${cardOpts.length ? '카드를 선택해 주세요' : '등록된 카드가 없어요'}</option>` : ''}${opts(cardOpts, v.card)}</select>
          ${ad && needPick && cardOpts.length ? '<small class="need-card">지정된 카드가 없어요. 카드를 골라 주세요</small>' : ''}
          <small>카드 목록은 관리자가 설정에서 등록해요</small></label>
        <div class="field">
          <label for="ad-image">소재 이미지</label>
          <input type="file" id="ad-image" name="image" accept=".jpg,.jpeg,.png,image/jpeg,image/png"${v.imagePath ? '' : ' required'}>
          <small>jpg, jpeg, png 파일만 올릴 수 있어요${v.imagePath ? ' · 새 파일을 고르면 지금 이미지가 바뀌어요' : ''}</small>
          <div class="img-preview">${v.image ? `<img src="${esc(v.image)}" alt="현재 소재 이미지">` : ''}</div>
        </div>
        <label class="field"><span>작성자 이름</span><input name="author" required maxlength="20" value="${esc(rememberedAuthor())}" placeholder="수정 이력에 남을 이름">
          <small>팀 공용 계정이라 누가 바꿨는지 이름을 남겨 주세요</small></label>
        <div class="dlg-actions">
          <button type="button" class="btn ghost" data-act="close">취소</button>
          <button class="btn">${ad ? '저장' : '등록'}</button>
        </div>
      </form>`;
    openDialog();
  }

  const sameAd = (old, row) => old.team === row.team_id && old.media === row.media_id && old.name === row.name
    && old.objective === row.objective && old.status === row.status && old.start === row.start_date
    && (old.end || null) === row.end_date && old.currency === row.currency
    && old.daily === row.daily_budget && old.monthly === row.monthly_budget && (old.card || null) === row.card_id;

  async function uploadImage(path, dataUrl) {
    const blob = await (await fetch(dataUrl)).blob();
    must(await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' }));
  }

  async function submitAd(f) {
    const d = new FormData(f);
    const old = f.dataset.id ? findAd(f.dataset.id) : null;
    const row = {
      team_id: isTeam ? account.team : d.get('team'),
      media_id: d.get('media'), name: d.get('name').trim(), objective: d.get('objective'), status: d.get('status'),
      start_date: d.get('start'), end_date: d.get('end') || null, currency: d.get('currency'),
      daily_budget: Number(d.get('daily')), monthly_budget: Number(d.get('monthly')), card_id: d.get('card') || null,
    };
    if (row.end_date && row.end_date < row.start_date) return toast('종료일이 시작일보다 빨라요. 날짜를 확인해 주세요.');
    const image = pendingImage;
    if (!image && !old?.imagePath) return toast('소재 이미지를 넣어 주세요 (jpg, jpeg, png)');
    const who = rememberAuthor(d.get('author'));
    if (old && !image && sameAd(old, row)) { dlg.close(); return toast('바뀐 내용이 없어요'); }

    // 이미지 폴더 이름이 광고 id라서, 새 광고는 먼저 저장한 뒤에 이미지를 올림
    const id = old?.id ?? uuid();
    const path = image ? `${id}/${Date.now()}.jpg` : old.imagePath;
    let imageFailed = false;
    const ok = await run(f, async () => {
      if (old) {
        if (image) await uploadImage(path, image);
        must(await sb.from('ads').update({ ...row, image_path: path, updated_by: who }).eq('id', id));
        if (image && old.imagePath) await sb.storage.from(BUCKET).remove([old.imagePath]);
      } else {
        must(await sb.from('ads').insert({ id, ...row, image_path: path, updated_by: who }));
        try {
          await uploadImage(path, image);
        } catch (e) {
          console.error(e);
          imageFailed = true;
          await sb.from('ads').update({ image_path: null, updated_by: who }).eq('id', id);
        }
      }
      await reload();
    });
    if (!ok) return;
    dlg.close();
    toast(imageFailed ? '광고는 등록했지만 이미지를 올리지 못했어요. 광고 정보 수정에서 다시 올려 주세요.'
      : old ? '광고 정보를 저장했어요' : '광고를 등록했어요');
    route();
  }

  function handleImage(input) {
    const file = input.files[0];
    const preview = input.closest('.field').querySelector('.img-preview');
    // 못 쓰는 파일이면 선택을 비우고 미리보기를 원래 이미지로 되돌림
    const reject = (msg) => {
      input.value = '';
      pendingImage = null;
      preview.innerHTML = formImage ? `<img src="${esc(formImage)}" alt="현재 소재 이미지">` : '';
      toast(msg);
    };
    if (!IMAGE_TYPES.includes(file.type) || !/\.(jpe?g|png)$/i.test(file.name)) return reject('jpg, jpeg, png 파일만 올릴 수 있어요');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 800 / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * scale);
        cv.height = Math.round(img.height * scale);
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        pendingImage = cv.toDataURL('image/jpeg', 0.75);
        preview.innerHTML = `<img src="${pendingImage}" alt="선택한 소재 미리보기">`;
      };
      img.onerror = () => reject('이미지를 읽지 못했어요. 다른 파일로 시도해 주세요.');
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // ---------- 성과 입력 ----------
  const numField = (name, label, step = '1') =>
    `<label class="field"><span>${label}</span><input type="number" name="${name}" min="0" step="${step}" required inputmode="decimal"></label>`;

  function perfForm(id) {
    if (!canEdit) return;
    const ad = findAd(id);
    if (!ad) return;
    const start = state.latestWeek;
    const cur = ad.currency;
    const step = cur === 'USD' ? '0.01' : '1';

    dlg.innerHTML = `
      <form id="perf-form" class="dlg-body form" data-id="${ad.id}">
        <div class="dlg-head">
          <div><p class="eyebrow">${esc(mediaName(ad.media))} · ${OBJECTIVE[ad.objective]} 광고</p><h2>${esc(ad.name)} 성과 입력</h2></div>
          <button type="button" class="icon-btn" data-act="close" aria-label="닫기">×</button>
        </div>
        <div class="grid2">
          <label class="field"><span>주 시작일 (월요일)</span><input type="date" name="start" required value="${start}">
            <small>다른 요일을 골라도 그 주 월요일로 맞춰져요</small></label>
          <div class="field"><span>입력 기간</span><div class="week-label" id="week-label">${weekLabel(start)}</div></div>
        </div>
        <p class="note" id="exists-note" hidden>이미 입력된 주예요. 저장하면 새 숫자로 바뀌어요.</p>
        <p class="hint">매체 광고 관리자 화면에서 같은 기간의 숫자를 그대로 옮겨 적어 주세요.</p>
        <div class="grid3">
          ${numField('spend', `광고비 (${cur})`, step)}
          ${numField('impressions', '노출수')}
          ${numField('clicks', '클릭수')}
          ${numField('conversions', ad.objective === 'sales' ? '전환수 (구매)' : '전환수 (상담·신청)')}
          ${numField('revenue', `매출 (${cur})${ad.objective === 'traffic' ? ' · 없으면 0' : ''}`, step)}
        </div>
        <div class="preview" id="perf-preview"></div>
        <label class="field"><span>작성자 이름</span><input name="author" required maxlength="20" value="${esc(rememberedAuthor())}" placeholder="수정 이력에 남을 이름">
          <small>팀 공용 계정이라 누가 입력했는지 이름을 남겨 주세요</small></label>
        <div class="dlg-actions">
          <button type="button" class="btn ghost" data-act="close">취소</button>
          <button class="btn">저장</button>
        </div>
      </form>`;
    openDialog();
    const f = $('#perf-form');
    fillExisting(f, ad);
    updatePerfPreview(f);
  }

  const PERF_KEYS = ['spend', 'impressions', 'clicks', 'conversions', 'revenue'];
  const perfStart = (f) => (f.elements.start.value ? mondayOf(f.elements.start.value) : '');
  function fillExisting(f, ad) {
    const ex = ad.perf.find((p) => p.start === perfStart(f));
    if (ex) PERF_KEYS.forEach((k) => { f.elements[k].value = ex[k]; });
    else if (f.dataset.prefilled === '1') PERF_KEYS.forEach((k) => { f.elements[k].value = ''; });
    f.dataset.prefilled = ex ? '1' : '';
    $('#exists-note').hidden = !ex;
  }
  function readPerf(f) {
    const p = { start: perfStart(f) };
    PERF_KEYS.forEach((k) => { p[k] = Number(f.elements[k].value) || 0; });
    ['impressions', 'clicks', 'conversions'].forEach((k) => { p[k] = Math.round(p[k]); });
    return p;
  }
  function updatePerfPreview(f) {
    const ad = findAd(f.dataset.id);
    const p = readPerf(f);
    $('#week-label').textContent = p.start ? weekLabel(p.start) : '-';
    const m = calc(p);
    const list = monthList(ad).filter((x) => x.start !== p.start);
    if (p.start.startsWith(state.reportMonth)) list.push(p);
    const g = grade(ad, list);
    const c = ad.currency;
    $('#perf-preview').innerHTML = `
      <div class="preview-metrics">
        <span>CPC <strong>${m.cpc != null ? money(m.cpc, c) : '-'}</strong></span>
        <span>CTR <strong>${m.ctr != null ? pct(m.ctr) : '-'}</strong></span>
        <span>CPA <strong>${m.cpa != null ? money(m.cpa, c) : '-'}</strong></span>
        <span>ROAS <strong>${p.revenue && m.roas != null ? `${m.roas.toFixed(2)}배` : '-'}</strong></span>
      </div>
      <div class="preview-grade">${pill(g)}<span class="hint">${monthLabel()} 누적 기준 예상 판정</span></div>`;
  }

  async function submitPerf(f) {
    const ad = findAd(f.dataset.id);
    if (!ad) return;
    const p = readPerf(f);
    if (!p.start) return toast('주 시작일을 골라 주세요');
    if (!p.spend) return toast('광고비를 입력해 주세요');
    if (p.clicks > p.impressions) return toast('클릭수가 노출수보다 많아요. 숫자를 확인해 주세요.');
    const author = rememberAuthor(f.elements.author.value);
    const ok = await run(f, async () => {
      must(await sb.from('ad_performance').upsert({
        ad_id: ad.id, week_start: p.start, spend: p.spend, impressions: p.impressions, clicks: p.clicks,
        conversions: p.conversions, revenue: p.revenue, author,
      }, { onConflict: 'ad_id,week_start' }));
      // 방금 넣은 주가 화면에 바로 보이도록 그 달로 맞춤
      pickedMonth = p.start.slice(0, 7);
      await reload();
    });
    if (!ok) return;
    dlg.close();
    const saved = findAd(ad.id);
    toast(`저장했어요 · ${monthWord()} 판정: ${GRADES[grade(saved).key].label}`);
    route();
  }

  // ---------- 수정 이력 ----------
  function renderLogs() {
    let logs = [...state.logs];
    if (logFilter) logs = logs.filter((l) => (l.team ?? 'admin') === logFilter);
    main.innerHTML = `
      <div class="page-head"><div><p class="eyebrow">누가 언제 무엇을 바꿨는지 · 최근 300건</p><h1>수정 이력</h1></div></div>
      <div class="filters">${filterSelect('f-log', '모든 팀', [...teamOpts(), ['admin', '관리자']], logFilter)}</div>
      <section class="panel">
        <ul class="log">${logs.map((l) => `
          <li>
            <time>${stampLabel(l.at)}</time>
            <div><strong>${esc(l.action)}</strong> · ${esc(l.target)}<span class="sub">${esc(l.detail)}</span></div>
            <div class="who">${esc(l.team ? teamName(l.team) : '관리자')}<span class="sub">${esc(l.who)}</span></div>
          </li>`).join('') || '<li class="empty">기록이 없어요</li>'}</ul>
      </section>
      <p class="hint">팀 공용 계정이라 이름은 입력한 사람이 직접 적은 값이에요.</p>`;
  }

  // ---------- 설정 ----------
  const TH_FIELDS = [['roasBest', '판매 ROAS 최상'], ['roasGood', '판매 ROAS 양호'], ['cpcBest', '유입 CPC 최상'], ['cpcGood', '유입 CPC 양호']];

  function renderSettings() {
    const s = state.settings;
    const thInput = (m, k, stepV) => `<input type="number" name="${m}.${k}" min="0" step="${stepV}" required value="${s.thresholds[m][k]}" aria-label="${k}">`;
    main.innerHTML = `
      <div class="page-head"><div><p class="eyebrow">관리자만 볼 수 있어요</p><h1>설정</h1></div></div>

      <form id="th-form" class="panel">
        <div class="panel-head"><h2>매체별 판정 기준</h2></div>
        <p class="hint">지금 값은 예시예요. 첫 한 달 데이터를 보고 조정해 주세요. CPC는 원화 기준이고, 바꾸면 모든 광고에 바로 적용돼요.</p>
        <div class="table-wrap">
          <table class="table th-table">
            <thead>
              <tr><th rowspan="2">매체</th><th colspan="2">판매 광고 · ROAS (배)</th><th colspan="2">유입 광고 · CPC (원)</th></tr>
              <tr><th>최상 (이상)</th><th>양호 (이상)</th><th>최상 (이하)</th><th>양호 (이하)</th></tr>
            </thead>
            <tbody>${state.media.map((m) => `
              <tr><th>${esc(m.name)}</th>
                <td>${thInput(m.id, 'roasBest', '0.1')}</td><td>${thInput(m.id, 'roasGood', '0.1')}</td>
                <td>${thInput(m.id, 'cpcBest', '10')}</td><td>${thInput(m.id, 'cpcGood', '10')}</td></tr>`).join('')}</tbody>
          </table>
        </div>
        <div class="inline-field">클릭이 <input type="number" name="holdMinClicks" min="0" step="1" required value="${s.holdMinClicks}" aria-label="판단 보류 클릭 수"> 회 미만이면 ${pill({ key: 'hold' })}</div>
        <div class="form-foot"><button class="btn">기준 저장</button></div>
      </form>

      <form id="rate-form" class="panel">
        <div class="panel-head"><h2>원화 환산 환율</h2></div>
        <p class="hint">예시 값이에요. 한 달에 한 번 정도 실제 환율로 바꿔 주세요.</p>
        <div class="grid3">${['USD', 'JPY', 'CNY'].map((c) => `
          <label class="field"><span>1 ${c}</span><div class="input-unit"><input type="number" name="${c}" min="0.01" step="0.01" required value="${s.rates[c]}"><span>원</span></div></label>`).join('')}</div>
        <div class="form-foot"><button class="btn">환율 저장</button></div>
      </form>

      <section class="panel">
        <div class="panel-head"><h2>결제 카드</h2></div>
        <p class="hint">카드 번호 전체는 저장하지 않아요. 별칭과 끝 4자리만 적어 주세요.</p>
        <ul class="card-list">${state.cards.map((c) => `
          <li><span>${esc(cardLabel(c.id))}</span>
            <span class="card-side"><span class="muted">광고 ${state.ads.filter((a) => a.card === c.id).length}개</span>
              <button type="button" class="link-btn quiet" data-act="del-card" data-id="${esc(c.id)}">삭제</button></span></li>`).join('') || '<li class="empty">등록된 카드가 없어요</li>'}</ul>
        <form id="card-form" class="card-add">
          <input name="name" required maxlength="30" placeholder="별칭 (예: 법인 신한)" aria-label="카드 별칭">
          <input name="last4" required pattern="\\d{4}" maxlength="4" inputmode="numeric" placeholder="끝 4자리" aria-label="카드 끝 4자리">
          <button class="btn ghost">카드 추가</button>
        </form>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>계정 비밀번호</h2></div>
        <p class="hint">숫자 4자리예요. 바꾸면 그 계정으로 접속해 있던 사람은 1시간 안에 접속이 끊기고, 새 비밀번호로 다시 들어와야 해요.</p>
        <ul class="card-list">${state.accounts.map((a) => `
          <li><span>${esc(a.name)}</span>
            <form class="pin-form" data-login="${esc(a.login_id)}" data-name="${esc(a.name)}">
              <input type="password" name="pin" inputmode="numeric" maxlength="4" autocomplete="new-password" placeholder="새 4자리" aria-label="${esc(a.name)} 새 비밀번호">
              <button class="btn ghost">변경</button>
            </form></li>`).join('')}</ul>
      </section>`;
  }

  async function submitThresholds(f) {
    const d = new FormData(f);
    const changed = [];
    for (const m of state.media) {
      const t = Object.fromEntries(TH_FIELDS.map(([k]) => [k, Number(d.get(`${m.id}.${k}`))]));
      if (t.roasBest < t.roasGood) return toast(`${m.name}: ROAS 최상 기준은 양호 기준보다 커야 해요`);
      if (t.cpcBest > t.cpcGood) return toast(`${m.name}: CPC 최상 기준은 양호 기준보다 작아야 해요`);
      const old = state.settings.thresholds[m.id];
      if (TH_FIELDS.some(([k]) => old[k] !== t[k])) changed.push([m.id, t]);
    }
    const hold = Math.round(Number(d.get('holdMinClicks')));
    const holdChanged = hold !== state.settings.holdMinClicks;
    if (!changed.length && !holdChanged) return toast('바뀐 내용이 없어요');
    const ok = await run(f, async () => {
      for (const [id, t] of changed) {
        must(await sb.from('media').update({ roas_best: t.roasBest, roas_good: t.roasGood, cpc_best: t.cpcBest, cpc_good: t.cpcGood }).eq('id', id));
      }
      if (holdChanged) must(await sb.from('settings').update({ hold_min_clicks: hold }).eq('id', true));
      await reload();
    });
    if (ok) { toast('판정 기준을 저장했어요. 모든 광고에 바로 적용돼요'); renderSettings(); }
  }

  async function submitRates(f) {
    const d = new FormData(f);
    const next = { USD: Number(d.get('USD')), JPY: Number(d.get('JPY')), CNY: Number(d.get('CNY')) };
    if (Object.values(next).some((v) => !(v > 0))) return toast('환율은 0보다 커야 해요');
    if (['USD', 'JPY', 'CNY'].every((c) => next[c] === state.settings.rates[c])) return toast('바뀐 내용이 없어요');
    const ok = await run(f, async () => {
      must(await sb.from('settings').update({ rate_usd: next.USD, rate_jpy: next.JPY, rate_cny: next.CNY }).eq('id', true));
      await reload();
    });
    if (ok) { toast('환율을 저장했어요'); renderSettings(); }
  }

  async function submitCard(f) {
    const d = new FormData(f);
    const name = d.get('name').trim();
    const last4 = d.get('last4').trim();
    if (!/^\d{4}$/.test(last4)) return toast('끝 4자리 숫자만 적어 주세요');
    const ok = await run(f, async () => {
      must(await sb.from('cards').insert({ name, last4 }));
      await reload();
    });
    if (ok) { toast('카드를 추가했어요'); renderSettings(); }
  }

  async function deleteCard(id) {
    if (!canSettings || !state.cards.some((c) => c.id === id)) return;
    const label = cardLabel(id);
    const used = state.ads.filter((a) => a.card === id);
    const ask = used.length
      ? `${label} 카드를 삭제할까요?\n이 카드를 쓰던 광고 ${used.length}개는 "카드를 지정해 주세요"로 표시돼요.`
      : `${label} 카드를 삭제할까요?`;
    if (!confirm(ask)) return;
    const ok = await run(null, async () => {
      must(await sb.from('cards').delete().eq('id', id));
      await reload();
    }, '카드를 삭제하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
    if (ok) { toast('카드를 삭제했어요'); renderSettings(); }
  }

  async function submitPin(f) {
    const { login, name } = f.dataset;
    const pin = f.elements.pin.value;
    if (!/^\d{4}$/.test(pin)) return toast('숫자 4자리를 입력해 주세요');
    const self = login === account.id;
    if (!confirm(`${name} 계정의 비밀번호를 바꿀까요?\n${self ? '바꾸면 지금 바로 다시 로그인해야 해요.' : '그 계정으로 접속해 있던 사람은 다시 로그인해야 해요.'}`)) return;
    const ok = await run(f, async () => { must(await sb.rpc('admin_set_pin', { p_login: login, p_pin: pin })); },
      '비밀번호를 바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.');
    if (!ok) return;
    if (self) return logout();
    f.reset();
    toast(`${name} 비밀번호를 바꿨어요`);
  }

  // ---------- 화면 전환 · 이벤트 ----------
  const PAGES = { home: renderHome, ads: renderAds, logs: renderLogs, settings: renderSettings };
  function route() {
    let page = location.hash.slice(1) || 'home';
    if (!PAGES[page] || (page === 'logs' && !canSeeLogs) || (page === 'settings' && !canSettings)) page = 'home';
    currentPage = page;
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.page === page));
    PAGES[page]();
  }
  function go(page) {
    if (location.hash === `#${page}`) route();
    else location.hash = page;
  }
  function openDialog() {
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  async function logout() {
    await sb.auth.signOut({ scope: 'local' });
    location.replace('index.html');
  }

  function fatal(msg) {
    main.innerHTML = `<section class="panel"><p>${esc(msg)}</p><div><button class="btn ghost" data-act="reload">다시 불러오기</button></div></section>`;
  }

  // 다른 사람이 입력한 내용 반영: 창으로 돌아올 때와 1분마다 (입력 중이거나 설정 화면이면 건드리지 않음)
  async function refresh() {
    if (!state || saving || dlg.open || document.hidden || currentPage === 'settings') return;
    try {
      const before = JSON.stringify(state);
      await reload();
      if (JSON.stringify(state) !== before && !dlg.open) route();
    } catch (e) {
      console.error(e);
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('#logout')) { e.preventDefault(); logout(); return; }
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const { act, id } = el.dataset;
    if (act === 'reload') { location.reload(); return; }
    if (!state) return;
    if (act === 'open-ad') openAd(id);
    else if (act === 'new-ad') adForm();
    else if (act === 'edit-ad') adForm(id);
    else if (act === 'perf') perfForm(id);
    else if (act === 'close') dlg.close();
    else if (act === 'del-card') deleteCard(id);
    else if (act === 'filter-grade') { filters = { team: '', media: '', grade: el.dataset.grade }; go('ads'); }
    else if (act === 'filter-team') { filters = { team: el.dataset.team, media: '', grade: '' }; go('ads'); }
    else if (act === 'clear-filters') { filters = { team: '', media: '', grade: '' }; renderAds(); }
  });

  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { pendingImage = null; });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('tr[data-act]')) e.target.click();
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'f-team') { filters.team = t.value; renderAds(); }
    else if (t.id === 'f-media') { filters.media = t.value; renderAds(); }
    else if (t.id === 'f-grade') { filters.grade = t.value; renderAds(); }
    else if (t.id === 'f-log') { logFilter = t.value; renderLogs(); }
    else if (t.id === 'f-month') { pickedMonth = t.value; state.reportMonth = t.value; route(); }
    else if (t.id === 'ad-image' && t.files?.[0]) handleImage(t);
    else if (t.form?.id === 'perf-form' && t.name === 'start' && t.value) t.value = mondayOf(t.value);
  });

  document.addEventListener('input', (e) => {
    const f = e.target.form;
    if (f?.classList.contains('pin-form')) { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); return; }
    if (f?.id !== 'perf-form') return;
    if (e.target.name === 'start') fillExisting(f, findAd(f.dataset.id));
    updatePerfPreview(f);
  });

  document.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state || saving) return;
    if (e.target.classList.contains('pin-form')) { submitPin(e.target); return; }
    const handlers = { 'ad-form': submitAd, 'perf-form': submitPerf, 'th-form': submitThresholds, 'rate-form': submitRates, 'card-form': submitCard };
    handlers[e.target.id]?.(e.target);
  });

  // ---------- 시작 ----------
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.replace('index.html'); return; }
  const me = await sb.from('profiles').select('login_id, name, role, team_id').maybeSingle();
  if (me.error) { fatal('불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.'); return; }
  if (!me.data) { await logout(); return; }

  account = { id: me.data.login_id, name: me.data.name, role: me.data.role, team: me.data.team_id };
  isTeam = account.role === 'team';
  canEdit = account.role !== 'ceo';
  canSeeLogs = account.role !== 'team';
  canSettings = account.role === 'admin';
  $('#account-name').textContent = account.name;
  $('#account-tag').textContent = { ceo: '보기 전용', admin: '전체 관리', team: '팀 계정' }[account.role];
  $('#account-tag').hidden = false;
  document.querySelectorAll('[data-need="logs"]').forEach((el) => { el.hidden = !canSeeLogs; });
  document.querySelectorAll('[data-need="settings"]').forEach((el) => { el.hidden = !canSettings; });

  try {
    await reload();
  } catch (e) {
    console.error(e);
    fatal('불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.');
    return;
  }
  route();

  window.addEventListener('hashchange', route);
  window.addEventListener('focus', refresh);
  setInterval(refresh, 60000);
  sb.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') location.replace('index.html'); });
})();
