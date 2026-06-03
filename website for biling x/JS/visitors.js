// visitors.js
// Records a page visit for Billing X into the Supabase `visitors` table.
// Loaded on public pages (index, gallery, download) — NOT on admin.

(function(){
  const supa = window.supabaseClient || window.supabase;
  if(!supa || !supa.from) return;

  const KEY_COOLDOWN = 'zb_visit_tracking_cooldown_v1';

  function detectBrowser(){
    const ua = navigator.userAgent || '';
    const s = ua.toLowerCase();
    if(s.includes('firefox')) return 'Firefox';
    if(s.includes('edg')) return 'Edge';
    if(s.includes('chrome')) return 'Chrome';
    if(s.includes('safari')) return 'Safari';
    return 'Other';
  }

  function detectDevice(){
    const ua = navigator.userAgent || '';
    const s = ua.toLowerCase();
    if(s.includes('mobile')) return 'Mobile';
    if(s.includes('ipad') || s.includes('tablet')) return 'Tablet';
    return 'Desktop';
  }

  function currentPage(){
    const path = (location.pathname || '').split('/').pop();
    return path && path.length ? path : 'index.html';
  }

  async function trackVisit(){
    try{
      // Per-page cooldown so a refresh/navigation back doesn't double-count.
      const cd = localStorage.getItem(KEY_COOLDOWN);
      if(cd === '1') return;
      localStorage.setItem(KEY_COOLDOWN, '1');
      setTimeout(()=>localStorage.removeItem(KEY_COOLDOWN), 5 * 60 * 1000); // 5 min cooldown

      const payload = {
        country: null,
        city: null,
        ip: null,
        browser: detectBrowser(),
        device: detectDevice(),
        page: currentPage(),
        visit_time: new Date().toISOString()
      };

      await supa.from('visitors').insert(payload);
      // no UI change
    }catch(_e){
      // silent
    }
  }

  document.addEventListener('DOMContentLoaded', trackVisit);
})();
