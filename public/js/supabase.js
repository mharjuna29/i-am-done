// ==================== SUPABASE CONFIGURATION ====================
// Ganti dengan kredensial Supabase Anda
const SUPABASE_URL = 'https://pybxpprdwxylxdmojppy.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable_HMRlCIYcJbPg7czxTDr9JQ_wBhfyOhM';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== STATE MANAGEMENT ====================
let currentUser = null;
let currentSession = null;
let userSurahs = [];
let allSurahs = [];
let dailyProgress = [];

// ==================== HELPER FUNCTIONS ====================
function showLoading(show = true) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatDate(date) {
  const d = new Date(date);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}