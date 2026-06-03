// Supabase config for Billing X (ZBighype)
// Exposes: window.supabase (Supabase v2)

(function () {
  const SUPABASE_URL = "https://jojdazukirfubucnoxee.supabase.co";
  const SUPABASE_KEY = "sb_publishable_WiV5AmbmdG0n4BbXv8JbGA_lgT84m96";

  // If already created, don't recreate
  if (window.supabase && window.supabase.createClient) {
    return;
  }

  // supabase-js v2 global availability: window.supabase
  // We use: window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase SDK not loaded. Include @supabase/supabase-js@2 before supabase-config.js");
    return;
  }

  window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
})();

