// Auth helpers for Billing X (ZBighype)

(function () {
  const KEY = "adminLoggedIn";

  function setAdminLoggedIn() {
    localStorage.setItem(KEY, "true");
  }

  function logoutAdmin() {
    localStorage.removeItem(KEY);
    try {
      window.location.href = "login.html";
    } catch (_) {}
  }

  function requireAdmin() {
    if (localStorage.getItem(KEY) !== "true") {
      window.location.replace("login.html");
    }
  }

  window.BillingXAuth = {
    setAdminLoggedIn,
    logoutAdmin,
    requireAdmin,
  };
})();

