// 시안용 예시 데이터 — Supabase 연결 후 실제 데이터로 대체
window.DEMO_DATA = (() => {
  const w = (start, spend, impressions, clicks, conversions, revenue, author) =>
    ({ start, spend, impressions, clicks, conversions, revenue, author });

  const sample = (bg, fg, title) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
      <rect width="480" height="480" fill="${bg}"/>
      <circle cx="370" cy="120" r="90" fill="${fg}" opacity="0.15"/>
      <rect x="160" y="150" width="160" height="200" rx="28" fill="${fg}" opacity="0.25"/>
      <text x="240" y="60" text-anchor="middle" font-family="sans-serif" font-size="20" fill="${fg}" opacity="0.7">예시 소재</text>
      <text x="240" y="420" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="700" fill="${fg}">${title}</text>
    </svg>`)}`;

  return {
    reportMonth: '2026-09',
    latestWeek: '2026-09-22',

    teams: [
      { id: 'cos-kr', name: '화장품 국내' },
      { id: 'cos-global', name: '화장품 해외' },
      { id: 'clinic-cn', name: '클리닉 중국' },
      { id: 'clinic-jp', name: '클리닉 일본' },
    ],

    accounts: [
      { id: 'ceo', name: '대표', role: 'ceo' },
      { id: 'admin', name: '관리자', role: 'admin' },
      { id: 'cos-kr', name: '화장품 국내팀', role: 'team', team: 'cos-kr' },
      { id: 'cos-global', name: '화장품 해외팀', role: 'team', team: 'cos-global' },
      { id: 'clinic-cn', name: '클리닉 중국팀', role: 'team', team: 'clinic-cn' },
      { id: 'clinic-jp', name: '클리닉 일본팀', role: 'team', team: 'clinic-jp' },
    ],

    media: [
      { id: 'meta', name: '메타' },
      { id: 'google', name: '구글' },
      { id: 'tiktok', name: '틱톡' },
      { id: 'amazon', name: '아마존' },
      { id: 'x', name: '트위터(X)' },
    ],

    settings: {
      rates: { KRW: 1, USD: 1390, JPY: 9.3, CNY: 193 },
      holdMinClicks: 100,
      thresholds: {
        meta: { roasBest: 3, roasGood: 1.5, cpcBest: 400, cpcGood: 800 },
        google: { roasBest: 3, roasGood: 1.5, cpcBest: 600, cpcGood: 1200 },
        tiktok: { roasBest: 2.5, roasGood: 1.2, cpcBest: 300, cpcGood: 600 },
        amazon: { roasBest: 4, roasGood: 2, cpcBest: 700, cpcGood: 1400 },
        x: { roasBest: 2.5, roasGood: 1.2, cpcBest: 500, cpcGood: 1000 },
      },
    },

    cards: [
      { id: 'c1', name: '법인 신한', last4: '1234' },
      { id: 'c2', name: '법인 현대', last4: '5678' },
      { id: 'c3', name: '해외결제 하나 VISA', last4: '9012' },
    ],

    ads: [
      {
        id: 'a1', team: 'cos-kr', media: 'meta', name: '가을 신제품 수분크림 전환', objective: 'sales',
        status: 'running', start: '2026-09-01', end: '', currency: 'KRW', daily: 150000, monthly: 4500000, card: 'c1',
        image: sample('#DCE8F5', '#2F5C8F', '수분크림 가을 신제품'),
        perf: [
          w('2026-09-01', 1020000, 210000, 3100, 58, 3400000, '김지은'),
          w('2026-09-08', 1060000, 222000, 3300, 61, 3650000, '김지은'),
          w('2026-09-15', 1040000, 215000, 3200, 60, 3500000, '이서준'),
          w('2026-09-22', 1050000, 219000, 3250, 63, 3700000, '김지은'),
        ],
      },
      {
        id: 'a2', team: 'cos-kr', media: 'google', name: '브랜드 키워드 검색', objective: 'traffic',
        status: 'running', start: '2026-09-01', end: '', currency: 'KRW', daily: 50000, monthly: 1500000, card: 'c1', image: '',
        perf: [
          w('2026-09-01', 330000, 39000, 440, 11, 0, '이서준'),
          w('2026-09-08', 345000, 41500, 455, 12, 0, '이서준'),
          w('2026-09-15', 338000, 40200, 448, 10, 0, '김지은'),
          w('2026-09-22', 347000, 42000, 462, 13, 0, '이서준'),
        ],
      },
      {
        id: 'a3', team: 'cos-kr', media: 'tiktok', name: '숏폼 챌린지 #촉촉챌린지', objective: 'traffic',
        status: 'running', start: '2026-09-01', end: '', currency: 'KRW', daily: 100000, monthly: 3000000, card: 'c2',
        image: sample('#D9F0EA', '#1F6B5A', '#촉촉챌린지'),
        perf: [
          w('2026-09-01', 690000, 480000, 880, 5, 0, '박소연'),
          w('2026-09-08', 705000, 495000, 905, 6, 0, '박소연'),
          w('2026-09-15', 698000, 470000, 870, 4, 0, '박소연'),
          w('2026-09-22', 707000, 500000, 915, 7, 0, '박소연'),
        ],
      },
      {
        id: 'a4', team: 'cos-kr', media: 'x', name: '리트윗 추첨 이벤트', objective: 'traffic',
        status: 'paused', start: '2026-09-01', end: '', currency: 'KRW', daily: 30000, monthly: 900000, card: 'c2', image: '',
        perf: [
          w('2026-09-01', 210000, 52000, 60, 0, 0, '이서준'),
        ],
      },
      {
        id: 'a5', team: 'cos-global', media: 'amazon', name: '선크림 스폰서드 상품 (미국)', objective: 'sales',
        status: 'running', start: '2026-09-01', end: '', currency: 'USD', daily: 120, monthly: 3600, card: 'c3',
        image: sample('#F6EBCF', '#8A5A12', 'SUNSCREEN SPF50+'),
        perf: [
          w('2026-09-01', 830, 95000, 1150, 86, 2580, '정다은'),
          w('2026-09-08', 845, 97000, 1180, 88, 2660, '정다은'),
          w('2026-09-15', 838, 96000, 1165, 87, 2630, '정다은'),
          w('2026-09-22', 847, 98000, 1190, 90, 2720, '정다은'),
        ],
      },
      {
        id: 'a6', team: 'cos-global', media: 'meta', name: '미국 리타겟팅 (장바구니 이탈)', objective: 'sales',
        status: 'running', start: '2026-09-01', end: '', currency: 'USD', daily: 80, monthly: 2400, card: 'c3',
        image: sample('#F5DFE3', '#8C3446', '10% OFF COUPON'),
        perf: [
          w('2026-09-01', 555, 61000, 720, 41, 3050, '정다은'),
          w('2026-09-08', 562, 62500, 735, 43, 3120, '윤태호'),
          w('2026-09-15', 558, 61800, 728, 42, 3080, '윤태호'),
          w('2026-09-22', 565, 63000, 741, 44, 3160, '정다은'),
        ],
      },
      {
        id: 'a7', team: 'cos-global', media: 'tiktok', name: '틱톡샵 라이브 커머스', objective: 'sales',
        status: 'running', start: '2026-09-01', end: '', currency: 'USD', daily: 100, monthly: 3000, card: 'c3', image: '',
        perf: [
          w('2026-09-01', 695, 140000, 1900, 9, 640, '윤태호'),
          w('2026-09-08', 702, 142000, 1920, 10, 660, '윤태호'),
          w('2026-09-15', 698, 139000, 1880, 9, 630, '윤태호'),
          w('2026-09-22', 705, 143000, 1940, 10, 670, '윤태호'),
        ],
      },
      {
        id: 'a8', team: 'clinic-cn', media: 'meta', name: '피부시술 상담 신청 (중국어)', objective: 'traffic',
        status: 'running', start: '2026-09-01', end: '', currency: 'USD', daily: 60, monthly: 1800, card: 'c3', image: '',
        perf: [
          w('2026-09-01', 418, 88000, 1090, 22, 0, '한지우'),
          w('2026-09-08', 421, 89500, 1105, 24, 0, '한지우'),
          w('2026-09-15', 419, 88700, 1098, 23, 0, '한지우'),
          w('2026-09-22', 422, 90000, 1112, 25, 0, '한지우'),
        ],
      },
      {
        id: 'a9', team: 'clinic-cn', media: 'google', name: '중국어 검색 광고', objective: 'traffic',
        status: 'running', start: '2026-09-01', end: '', currency: 'USD', daily: 40, monthly: 1200, card: 'c3', image: '',
        perf: [
          w('2026-09-01', 278, 15200, 248, 4, 0, '한지우'),
          w('2026-09-08', 281, 15500, 252, 5, 0, '한지우'),
          w('2026-09-15', 279, 15300, 247, 4, 0, '한지우'),
        ],
      },
      {
        id: 'a10', team: 'clinic-jp', media: 'x', name: '리프팅 시술 후기 캠페인', objective: 'traffic',
        status: 'running', start: '2026-09-01', end: '', currency: 'JPY', daily: 15000, monthly: 450000, card: 'c3',
        image: sample('#E6E0F3', '#4E3C86', 'リフティング 体験談'),
        perf: [
          w('2026-09-01', 104000, 310000, 2580, 31, 0, '오하나'),
          w('2026-09-08', 105500, 315000, 2610, 33, 0, '오하나'),
          w('2026-09-15', 104800, 312000, 2595, 32, 0, '오하나'),
          w('2026-09-22', 105700, 318000, 2620, 34, 0, '오하나'),
        ],
      },
      {
        id: 'a11', team: 'clinic-jp', media: 'meta', name: '인스타 상담 예약', objective: 'traffic',
        status: 'running', start: '2026-09-01', end: '', currency: 'JPY', daily: 14000, monthly: 420000, card: 'c3', image: '',
        perf: [
          w('2026-09-01', 97500, 205000, 1690, 19, 0, '오하나'),
          w('2026-09-08', 98200, 208000, 1705, 20, 0, '오하나'),
          w('2026-09-15', 97800, 206000, 1698, 19, 0, '오하나'),
          w('2026-09-22', 98500, 209000, 1712, 21, 0, '오하나'),
        ],
      },
      {
        id: 'a12', team: 'clinic-jp', media: 'google', name: '일본 검색 광고 (테스트)', objective: 'traffic',
        status: 'ended', start: '2026-09-01', end: '2026-09-14', currency: 'JPY', daily: 10000, monthly: 300000, card: 'c3', image: '',
        perf: [
          w('2026-09-01', 69800, 21000, 895, 8, 0, '오하나'),
          w('2026-09-08', 70200, 21500, 905, 9, 0, '오하나'),
        ],
      },
    ],

    logs: [
      { at: '2026-09-29T10:12', team: 'cos-kr', who: '김지은', action: '성과 입력', target: '가을 신제품 수분크림 전환', detail: '9/22~9/28 · 광고비 ₩1,050,000 · 클릭 3,250 · 매출 ₩3,700,000' },
      { at: '2026-09-29T09:40', team: 'clinic-jp', who: '오하나', action: '성과 입력', target: '리프팅 시술 후기 캠페인', detail: '9/22~9/28 · 광고비 ¥105,700 · 클릭 2,620 · 매출 ¥0' },
      { at: '2026-09-28T17:40', team: null, who: '관리자', action: '판정 기준 수정', target: '틱톡', detail: '유입 CPC 양호 700 → 600' },
      { at: '2026-09-26T11:05', team: 'cos-global', who: '정다은', action: '광고 수정', target: '틱톡샵 라이브 커머스', detail: '월 예산 $2,500 → $3,000' },
      { at: '2026-09-22T15:30', team: 'cos-kr', who: '이서준', action: '광고 수정', target: '리트윗 추첨 이벤트', detail: '상태 진행중 → 일시정지' },
      { at: '2026-09-15T10:00', team: 'clinic-jp', who: '오하나', action: '광고 수정', target: '일본 검색 광고 (테스트)', detail: '상태 진행중 → 종료' },
      { at: '2026-09-01T09:20', team: 'clinic-cn', who: '한지우', action: '광고 등록', target: '중국어 검색 광고', detail: '구글 · 월 예산 $1,200' },
    ],
  };
})();
