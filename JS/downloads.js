// downloads.js
// Handles click tracking for Billing X download link.

(function(){
  const supa = window.supabaseClient || window.supabase;
  if(!supa || !supa.from) return;

  const KEY_COOLDOWN = 'zb_download_tracking_cooldown_v1';

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

  async function trackDownload(){
    try{
      const cd = localStorage.getItem(KEY_COOLDOWN);
      if(cd === '1') return;
      localStorage.setItem(KEY_COOLDOWN, '1');
      setTimeout(()=>localStorage.removeItem(KEY_COOLDOWN), 10 * 60 * 1000); // 10 min cooldown

      const payload = {
        country: null,
        city: null,
        ip: null,
        browser: detectBrowser(),
        device: detectDevice(),
        download_time: new Date().toISOString()
      };

      await supa.from('downloads').insert(payload);
      // no UI change
    }catch(_e){
      // silent
    }
  }

  function bind(){
    const btn = document.getElementById('downloadBtn');
    if(!btn) return;

    btn.addEventListener('click', (e)=>{
      // Track immediately, don't block navigation.
      trackDownload();
    });
  }

  document.addEventListener('DOMContentLoaded', bind);
})();

