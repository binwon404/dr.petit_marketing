// Supabase 연결 정보
// 여기에는 공개해도 되는 키(publishable)만 넣을 것 — 관리자 키(service_role)는 절대 금지
// 접속 정보는 탭을 닫으면 지워지도록 sessionStorage에 보관 (공용 PC에서 다음 사람이 그대로 들어가는 것 방지)
window.sb = supabase.createClient(
  'https://iudkciokkdniyzkewair.supabase.co',
  'sb_publishable_64z_TDqUHu9XzVVuN2pLmA_D1HR8hUC',
  { auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);
