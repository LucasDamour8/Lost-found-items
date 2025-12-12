// dashboard.js
// SPA navigation, profile dropdown, settings persistence, live clock and session timer
(function () {
  // --- helpers ---
  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from((root || document).querySelectorAll(sel)); }
  function fmtTime(date) {
    const z = n => String(n).padStart(2,'0');
    return `${z(date.getHours())}:${z(date.getMinutes())}:${z(date.getSeconds())}`;
  }
  function fmtDuration(seconds) {
    const z = n => String(n).padStart(2,'0');
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${z(h)}:${z(m)}:${z(s)}`;
  }

  // Elements
  const menuButtons = $all('.menu button');
  const sections = {
    overview: $('#overview'),
    'reported-lost': $('#reported-lost'),
    'reported-found': $('#reported-found'),
    contacts: $('#contacts'),
    requests: $('#requests'),
    revenue: $('#revenue'),
    settings: $('#settings')
  };

  const sidebar = $('#sidebar');
  const toggleBtn = $('#toggle-sidebar');
  const profileBtn = $('#profile-btn');
  const profileDropdown = $('#profile-dropdown');
  const profileCircle = $('#profile-circle');
  const usernameDisplay = $('#username-display');
  const dropdownName = $('#dropdown-name');
  const dropdownPhone = $('#dropdown-phone');
  const sessionStartInfo = $('#session-start-info');

  const avatarPlaceholder = $('#avatar-placeholder');
  const settingsAvatarBlank = $('#settings-avatar-blank');
  const settingsAvatar = $('#settings-avatar');
  const avatarFile = $('#avatar-file');
  const avatarRemove = $('#avatar-remove');

  const usernameInput = $('#username');
  const phoneInput = $('#phone');
  const locationInput = $('#location');
  const saveSettingsBtn = $('#save-settings');
  const cancelSettingsBtn = $('#cancel-settings');
  const settingsMsg = $('#settings-msg');

  // Stats / tables
  const statLost = $('#stat-lost');
  const statFound = $('#stat-found');
  const statRequests = $('#stat-requests');
  const statRevenue = $('#stat-revenue');
  const recentTableBody = $('#recent-table tbody');
  const lostTableBody = $('#lost-table tbody');
  const foundTableBody = $('#found-table tbody');
  const requestsBody = $('#requests-body');
  const revenueTotal = $('#revenue-total');

  // Buttons
  const signout = $('#signout');
  const signoutLeft = $('#signout-left');
  const goSettings = $('#go-settings');
  const btnReportLost = $('#btn-report-lost');
  const btnSearchDb = $('#btn-search-db');

  // clock elements
  const currentTimeEl = $('#current-time');
  const sessionTimeEl = $('#session-time');

  // small sample store using localStorage
  const STORAGE_KEY = 'lf_admin_state_v1';
  const SESSION_KEY = 'lf_session_v1';

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {
      profile: { name: 'Guest', phone: '+250000000000', location: '' , avatar: null },
      stats: { lost:0, found:0, requests:0, revenue:0 },
      recent: [], lost: [], found: [], requestsList: []
    };
    try { return JSON.parse(raw); } catch(e) { return null; }
  }
  function saveState(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

  // initialize with state or defaults
  let state = loadState();
  if (!state) {
    state = {
      profile: { name: 'Guest', phone: '+2507837551555', location:'', avatar:null },
      stats: { lost:0, found:0, requests:0, revenue:0 },
      recent: [], lost: [], found: [], requestsList: []
    };
    saveState(state);
  }

  // session handling: store session start timestamp in localStorage so refresh preserves timer
  function getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { return null; }
  }
  function startSession() {
    const s = { startAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return s;
  }
  function endSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  let session = getSession();
  if (!session) session = startSession();

  // --- UI update functions ---
  function renderProfile() {
    const p = state.profile;
    usernameDisplay.textContent = p.name || 'Guest';
    dropdownName.textContent = p.name || 'Guest';
    dropdownPhone.textContent = p.phone || '';
    phoneInput.value = p.phone || '';
    usernameInput.value = p.name || '';
    locationInput.value = p.location || '';
    sessionStartInfo.textContent = session && session.startAt ? `Session started: ${new Date(session.startAt).toLocaleString()}` : 'Session started: -';

    // avatar in top-right
    // remove existing <img> if present
    const existImg = profileCircle.querySelector('img');
    if (existImg) existImg.remove();

    if (p.avatar) {
      avatarPlaceholder && (avatarPlaceholder.style.display = 'none');
      const img = document.createElement('img');
      img.src = p.avatar;
      img.alt = 'avatar';
      profileCircle.appendChild(img);
    } else {
      // no image
      avatarPlaceholder && (avatarPlaceholder.style.display = 'flex');
      avatarPlaceholder.textContent = 'No';
    }

    // settings avatar preview
    const existPreviewImg = settingsAvatar.querySelector('img');
    if (existPreviewImg) existPreviewImg.remove();
    if (p.avatar) {
      settingsAvatarBlank && (settingsAvatarBlank.style.display = 'none');
      const img = document.createElement('img');
      img.src = p.avatar;
      img.alt = 'avatar';
      img.style.width='100%';
      img.style.height='100%';
      img.style.objectFit='cover';
      settingsAvatar.appendChild(img);
    } else {
      settingsAvatarBlank && (settingsAvatarBlank.style.display = 'flex');
      settingsAvatarBlank.textContent = 'No Photo';
    }
  }

  function renderStatsAndTables() {
    const s = state.stats;
    statLost.textContent = s.lost;
    statFound.textContent = s.found;
    statRequests.textContent = s.requests;
    statRevenue.textContent = `$${s.revenue}`;
    revenueTotal.textContent = `$${s.revenue}`;

    // recent
    if (state.recent && state.recent.length) {
      recentTableBody.innerHTML = '';
      state.recent.slice().reverse().forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r.type}</td><td>${r.item}</td><td>${r.by}</td><td>${r.loc}</td><td>${r.date}</td>`;
        recentTableBody.appendChild(tr);
      });
    } else {
      recentTableBody.innerHTML = `<tr><td colspan="5" class="kv">No activity yet</td></tr>`;
    }

    // lost
    if (state.lost && state.lost.length) {
      lostTableBody.innerHTML = '';
      state.lost.forEach(l => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${l.item}</td><td>${l.owner}</td><td>${l.loc}</td><td>${l.date}</td><td class="kv">Lost</td>`;
        lostTableBody.appendChild(tr);
      });
    } else {
      lostTableBody.innerHTML = `<tr><td colspan="5" class="kv">No lost items yet</td></tr>`;
    }

    // found
    if (state.found && state.found.length) {
      foundTableBody.innerHTML = '';
      state.found.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${f.item}</td><td>${f.finder}</td><td>${f.loc}</td><td>${f.date}</td><td class="kv">Found</td>`;
        foundTableBody.appendChild(tr);
      });
    } else {
      foundTableBody.innerHTML = `<tr><td colspan="5" class="kv">No found items yet</td></tr>`;
    }

    // requests
    if (state.requestsList && state.requestsList.length) {
      requestsBody.innerHTML = '';
      state.requestsList.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r.user}</td><td>${r.type}</td><td>${r.item}</td><td>${r.date}</td><td>${r.status}</td>`;
        requestsBody.appendChild(tr);
      });
    } else {
      requestsBody.innerHTML = `<tr><td colspan="5" class="kv">No requests yet</td></tr>`;
    }
  }

  // --- SPA navigation ---
  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      menuButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.section;
      for (const k in sections) {
        if (k === target) sections[k].style.display = '';
        else sections[k].style.display = 'none';
      }
      // close mobile sidebar
      sidebar.classList.remove('open');
      // smooth scroll top of main
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // initial show overview
  for (const k in sections) {
    sections[k].style.display = (k === 'overview') ? '' : 'none';
  }

  // mobile toggle
  toggleBtn && toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // profile dropdown
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('active');
  });
  // close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
      profileDropdown.classList.remove('active');
    }
  });

  // go to settings from dropdown
  goSettings.addEventListener('click', () => {
    // open settings in menu
    menuButtons.forEach(b => { if (b.dataset.section === 'settings') b.click(); });
    profileDropdown.classList.remove('active');
  });

  // signout handlers
  function doSignOut() {
    // clear session + reset profile to guest (demo behavior)
    endSession();
    state.profile = { name: 'Guest', phone: '+250783722606', location:'', avatar:null };
    saveState(state);
    renderProfile();
    renderStatsAndTables();
    alert('You are signed out (demo).');
  }
  signout && signout.addEventListener('click', doSignOut);
  signoutLeft && signoutLeft.addEventListener('click', doSignOut);

  // Settings: avatar upload
  avatarFile.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      const dataUrl = ev.target.result;
      state.profile.avatar = dataUrl;
      saveState(state);
      renderProfile();
    };
    reader.readAsDataURL(f);
  });
  avatarRemove.addEventListener('click', () => {
    state.profile.avatar = null;
    saveState(state);
    avatarFile.value = '';
    renderProfile();
  });

  // save settings
  saveSettingsBtn.addEventListener('click', () => {
    const name = usernameInput.value.trim() || 'Guest';
    const loc = locationInput.value.trim() || '';
    state.profile.name = name;
    state.profile.location = loc;
    saveState(state);
    renderProfile();
    settingsMsg.textContent = 'Saved ✓';
    setTimeout(()=> settingsMsg.textContent = '', 2000);
  });
  cancelSettingsBtn.addEventListener('click', () => {
    renderProfile();
    settingsMsg.textContent = 'Changes cancelled';
    setTimeout(()=> settingsMsg.textContent = '', 1500);
  });

  // Buttons that add sample data (demo-only)
  $('#add-lost-sample').addEventListener('click', () => {
    const now = new Date().toLocaleString();
    const item = { item: 'ID Card', owner: 'Alice', loc: 'Kigali', date: now };
    state.lost.push(item);
    state.recent.push({ type:'Lost', item:'ID Card', by:'Alice', loc:'Kigali', date:now });
    state.stats.lost++; state.stats.requests += 0;
    saveState(state); renderStatsAndTables();
  });
  $('#add-found-sample').addEventListener('click', () => {
    const now = new Date().toLocaleString();
    const item = { item: 'Wallet', finder: 'Bob', loc: 'Remera', date: now };
    state.found.push(item);
    state.recent.push({ type:'Found', item:'Wallet', by:'Bob', loc:'Remera', date:now });
    state.stats.found++;
    saveState(state); renderStatsAndTables();
  });

  // quick actions
  $('#refresh-sample').addEventListener('click', () => {
    renderStatsAndTables();
    alert('Refreshed (demo).');
  });

  $('#export-btn').addEventListener('click', () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dashboard-export.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });

  // report/search CTA behaviors
  btnReportLost && btnReportLost.addEventListener('click', () => {
    menuButtons.forEach(b => { if (b.dataset.section === 'reported-lost') b.click(); });
    window.scrollTo({ top:0, behavior:'smooth' });
  });
  btnSearchDb && btnSearchDb.addEventListener('click', () => {
    menuButtons.forEach(b => { if (b.dataset.section === 'reported-found') b.click(); });
    window.scrollTo({ top:0, behavior:'smooth' });
  });

  // populate sample stats on first run if empty
  function ensureSampleStats() {
    if (!state.stats) state.stats = { lost:0, found:0, requests:0, revenue:0 };
    if (!state.recent) state.recent = [];
    if (!state.lost) state.lost = [];
    if (!state.found) state.found = [];
    if (!state.requestsList) state.requestsList = [];
    saveState(state);
  }

  // --- clock & session timer ---
  function updateClockAndSession() {
    const now = new Date();
    currentTimeEl && (currentTimeEl.textContent = fmtTime(now));

    const sessionRaw = getSession();
    if (sessionRaw && sessionRaw.startAt) {
      const seconds = Math.floor((Date.now() - sessionRaw.startAt) / 1000);
      sessionTimeEl && (sessionTimeEl.textContent = fmtDuration(seconds));
    } else {
      sessionTimeEl && (sessionTimeEl.textContent = '00:00:00');
    }
  }

  // start 1s interval
  updateClockAndSession();
  setInterval(updateClockAndSession, 1000);

  // initial render
  ensureSampleStats();
  renderProfile();
  renderStatsAndTables();

  // optional: add keyboard Esc to close dropdown
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { profileDropdown.classList.remove('active'); sidebar.classList.remove('open'); }
  });

})();
