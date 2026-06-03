// Admin authentication (local demo, production would use server auth)
(function(){
  const authForm = document.getElementById('authForm');
  const loginBtn = document.getElementById('loginBtn');
  const loginSpinner = document.getElementById('loginSpinner');
  const loginBtnText = document.getElementById('loginBtnText');
  const loginCard = document.getElementById('loginCard');

  const usernameEl = document.getElementById('username');
  const passwordEl = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const rememberMeEl = document.getElementById('rememberMe');

  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMsg = document.getElementById('toastMsg');

  const DEMO_USER = 'admin';
  const DEMO_PASS = 'Admin@2004';

  const KEY = 'adminLoggedIn';
  const KEY_REMEMBER = 'adminRememberMe';

  function setToast(title, msg){
    if(toastTitle) toastTitle.textContent = title;
    if(toastMsg) toastMsg.textContent = msg;
    if(toast){
      toast.classList.add('is-open');
      // hide after a moment
      clearTimeout(setToast._t);
      setToast._t = setTimeout(()=> toast.classList.remove('is-open'), 2600);
    }
  }

  function setLoading(isLoading){
    if(!loginBtn) return;
    if(isLoading){
      loginBtn.disabled = true;
      if(loginSpinner) loginSpinner.style.display = 'inline-block';
      if(loginBtnText) loginBtnText.textContent = 'Signing in…';
    } else {
      loginBtn.disabled = false;
      if(loginSpinner) loginSpinner.style.display = 'none';
      if(loginBtnText) loginBtnText.textContent = 'Login';
    }
  }

  function shake(){
    if(!loginCard) return;
    loginCard.classList.remove('shake');
    // force reflow
    void loginCard.offsetWidth;
    loginCard.classList.add('shake');
    setTimeout(()=> loginCard.classList.remove('shake'), 450);
  }

  function setSession({remember}={}){
    localStorage.setItem(KEY, 'true');
    localStorage.setItem(KEY_REMEMBER, remember ? '1' : '0');
  }

  function isLoggedIn(){
    return localStorage.getItem(KEY) === 'true';
  }

  // redirect if already logged in
  if(isLoggedIn()){
    window.location.replace('admin.html');
    return;
  }

  // password toggle
  if(togglePasswordBtn && passwordEl){
    togglePasswordBtn.addEventListener('click', ()=>{
      const isHidden = passwordEl.type === 'password';
      passwordEl.type = isHidden ? 'text' : 'password';
      togglePasswordBtn.textContent = isHidden ? '🙈' : '👁';
    });
  }

  // smooth glow on left
  const left = document.querySelector('[data-login-glow]');
  if(left){
    left.addEventListener('mousemove', (e)=>{
      const r = left.getBoundingClientRect();
      const mx = ((e.clientX - r.left)/r.width)*100;
      const my = ((e.clientY - r.top)/r.height)*100;
      left.style.setProperty('--mx', mx+'%');
      left.style.setProperty('--my', my+'%');
    });
  }

  if(authForm){
    authForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const username = (usernameEl?.value || '').trim();
      const password = passwordEl?.value || '';

      setLoading(true);
      try{
        // loading animation minimum time for premium feel
        await new Promise(r=>setTimeout(r, 650));

        if(username === DEMO_USER && password === DEMO_PASS){
          setSession({ remember: !!rememberMeEl?.checked });
          setToast('Login successful', 'Redirecting to Admin…');
          setTimeout(()=> window.location.replace('admin.html'), 450);
        } else {
          setToast('Access denied', 'Wrong username or password. Try again.');
          shake();
          setLoading(false);
        }
      }catch(_e){
        setToast('Something went wrong', 'Please try again.');
        shake();
        setLoading(false);
      }
    });
  }

})();

