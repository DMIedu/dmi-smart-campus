/**
 * ============================================================
 * DMI SMART CAMPUS - SHARED API CLIENT
 * Talks to Google Apps Script backend
 * ============================================================
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbxqdum1O0Vdjrh2GH0ocb1DzKfzeMmIlMkbK9N_u5L2PMPNE7cOLMhhd3EmH17eluvdoQ/exec';

// ===== UNIVERSAL API CALL =====
async function apiCall(action, params = {}) {
  const token = localStorage.getItem('dmi_token') || '';
  const body = JSON.stringify({ action, token, ...params });
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoid CORS preflight
      body: body
    });
    
    const data = await response.json();
    
    // Auto-handle expired sessions
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

// ===== SESSION HELPERS =====
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

// ===== UI HELPERS =====
function showToast(message, type = 'info') {
  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-slate-800',
    warning: 'bg-amber-600'
  };
  
  const toast = document.createElement('div');
  toast.className = `fixed top-6 right-6 z-50 ${colors[type]} text-white px-5 py-3 rounded-lg shadow-2xl transform translate-x-full transition-transform duration-300 max-w-sm`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.remove('translate-x-full'), 50);
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function showLoader(show = true) {
  let loader = document.getElementById('global-loader');
  if (show) {
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'global-loader';
      loader.className = 'fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center';
      loader.innerHTML = `
        <div class="bg-white rounded-2xl px-8 py-6 shadow-2xl flex items-center gap-4">
          <div class="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-slate-700 font-medium">Loading...</span>
        </div>
      `;
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
