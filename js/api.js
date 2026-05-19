/**
 * ============================================================
 * DMI SMART CAMPUS - SHARED API CLIENT
 * ============================================================
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbxqdum1O0Vdjrh2GH0ocb1DzKfzeMmIlMkbK9N_u5L2PMPNE7cOLMhhd3EmH17eluvdoQ/exec';

async function apiCall(action, params = {}) {
  const token = localStorage.getItem('dmi_token') || '';
  const body = JSON.stringify({ action, token, ...params });
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body
    });
    
    const data = await response.json();
    
    if (data.error === 'Invalid or expired session') {
      localStorage.clear();
      window.location.href = 'login.html';
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('API error:', err);
    return { success: false, error: 'Network error: ' + err.message };
  }
}

function getUser() {
  const u = localStorage.getItem('dmi_user');
  return u ? JSON.parse(u) : null;
}

function setSession(token, user) {
  localStorage.setItem('dmi_token', token);
  localStorage.setItem('dmi_user', JSON.stringify(user));
}

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

function requireAuth(allowedRoles = []) {
  const user = getUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert('Access denied for your role');
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

function showToast(message, type = 'info') {
  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-slate-800',
    warning: 'bg-amber-600'
  };
  
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;top:1.5rem;right:1.5rem;z-index:50;padding:0.75rem 1.25rem;border-radius:8px;color:white;box-shadow:0 10px 25px rgba(0,0,0,0.2);max-width:24rem;font-weight:500;transform:translateX(120%);transition:transform 300ms;`;
  
  const bgs = { success: '#059669', error: '#dc2626', info: '#1e293b', warning: '#d97706' };
  toast.style.background = bgs[type] || bgs.info;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.style.transform = 'translateX(0)', 50);
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function showLoader(show = true) {
  let loader = document.getElementById('global-loader');
  if (show) {
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'global-loader';
      loader.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(4px);z-index:50;display:flex;align-items:center;justify-content:center;';
      loader.innerHTML = `<div style="background:white;border-radius:1rem;padding:1.5rem 2rem;box-shadow:0 25px 50px rgba(0,0,0,0.25);display:flex;align-items:center;gap:1rem;"><div style="width:1.5rem;height:1.5rem;border:2px solid #1e3a8a;border-top-color:transparent;border-radius:9999px;animation:spin 0.8s linear infinite"></div><span style="font-weight:500;color:#334155">Loading...</span></div>`;
      document.body.appendChild(loader);
    }
  } else if (loader) {
    loader.remove();
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '-';
  return timeStr.toString().substring(0, 5);
}
