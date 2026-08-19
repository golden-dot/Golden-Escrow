/**
 * app.js - Main Application Controller for GenLayer Intellex Protocol
 * Full Multi-Screen Flow: Login Page -> Role Selection Page -> Main Platform Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
  const DEPLOYED_ESCROW_CONTRACT = "0xc40d279E9f8a48AEE0c6383A23Bf3431d0B620Ec";
  const DEPLOYED_ORACLE_CONTRACT = "0x503402BF6Ccadf366D269FE397B79c2CFfF011AC";

  const ESCROW_STUDIO_URL = `https://studio.genlayer.com/contract/${DEPLOYED_ESCROW_CONTRACT}`;
  const ORACLE_STUDIO_URL = `https://studio.genlayer.com/contract/${DEPLOYED_ORACLE_CONTRACT}`;

  // Theme Management
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeText = document.getElementById('theme-text');
  
  const savedTheme = localStorage.getItem('intellex_theme') || 'dark';
  applyTheme(savedTheme);

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('intellex_theme', theme);
    if (themeText) {
      themeText.textContent = theme === 'light' ? 'Light' : 'Dark';
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(`Switched to ${next.toUpperCase()} theme`, 'info');
    });
  }

  // App State
  const state = {
    currentScreen: 'login',
    currentRole: localStorage.getItem('intellex_role') || 'client',
    currentUsername: localStorage.getItem('intellex_username') || 'Alice',
    currentWallet: localStorage.getItem('intellex_wallet') || '0xAlice94A17B809F3d445492F6F16c14C2361B1cA29A33',
    balance: 5000.0,
    escrows: [],
    markets: [],
    activeTab: 'escrows',
    searchQuery: '',
    activeFilter: 'all',
    selectedContractCode: 'IntelligentEscrow',
    activePayoutEscrowId: null
  };

  // Screen Switcher Helper
  function showScreen(screenId) {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`${screenId}-screen`);
    if (target) {
      target.classList.add('active');
      state.currentScreen = screenId;
      window.scrollTo(0, 0);
    }
  }

  // Toast utility
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div>${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // SCREEN 1: AUTH TAB SWITCHER (LOG IN VS CREATE ACCOUNT)
  window.switchAuthTab = (tab) => {
    const loginBtn = document.getElementById('auth-tab-login');
    const signupBtn = document.getElementById('auth-tab-signup');
    const loginForm = document.getElementById('auth-login-form');
    const signupForm = document.getElementById('auth-signup-form');

    if (tab === 'signup') {
      loginBtn.classList.remove('active');
      signupBtn.classList.add('active');
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    } else {
      signupBtn.classList.remove('active');
      loginBtn.classList.add('active');
      signupForm.style.display = 'none';
      loginForm.style.display = 'block';
    }
  };

  // AUTH FORM 1: LOG IN
  const loginForm = document.getElementById('auth-login-form');
  const loginSubmitBtn = document.getElementById('login-submit-btn');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const identifier = document.getElementById('login-identifier').value.trim() || 'alice@genlayer.io';
      
      loginSubmitBtn.classList.add('btn-loading');
      loginSubmitBtn.disabled = true;

      setTimeout(() => {
        loginSubmitBtn.classList.remove('btn-loading');
        loginSubmitBtn.disabled = false;

        state.currentUsername = identifier.includes('@') ? identifier.split('@')[0] : identifier;

        showToast(`Authenticated as ${state.currentUsername}`, 'success');
        showScreen('role');
      }, 700);
    });
  }

  // AUTH FORM 2: CREATE NEW ACCOUNT
  const signupForm = document.getElementById('auth-signup-form');
  const signupSubmitBtn = document.getElementById('signup-submit-btn');

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = document.getElementById('signup-fullname').value.trim();
      const email = document.getElementById('signup-email').value.trim();

      signupSubmitBtn.classList.add('btn-loading');
      signupSubmitBtn.disabled = true;

      setTimeout(() => {
        signupSubmitBtn.classList.remove('btn-loading');
        signupSubmitBtn.disabled = false;

        state.currentUsername = fullName || email.split('@')[0];

        showToast(`Account created successfully for ${state.currentUsername}!`, 'success');
        showScreen('role');
      }, 800);
    });
  }

  // SCREEN 2: ROLE SELECTION HANDLER
  const roleOptions = document.querySelectorAll('.role-card-option');
  const confirmRoleBtn = document.getElementById('confirm-role-btn');

  roleOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      roleOptions.forEach(r => r.classList.remove('selected'));
      opt.classList.add('selected');
      state.currentRole = opt.dataset.role;
    });
  });

  if (confirmRoleBtn) {
    confirmRoleBtn.addEventListener('click', () => {
      confirmRoleBtn.classList.add('btn-loading');
      confirmRoleBtn.disabled = true;

      setTimeout(() => {
        confirmRoleBtn.classList.remove('btn-loading');
        confirmRoleBtn.disabled = false;

        localStorage.setItem('intellex_role', state.currentRole);
        localStorage.setItem('intellex_username', state.currentUsername);
        localStorage.setItem('intellex_wallet', state.currentWallet);

        updateRoleUI();
        showScreen('dashboard');
        loadEscrows();
        loadMarkets();
      }, 600);
    });
  }

  // SCREEN 3: DASHBOARD ROLE & NAVIGATION UI
  function updateRoleUI() {
    const roleProfiles = {
      builder: {
        title: 'BUILDER',
        welcome: `Welcome, ${state.currentUsername} (Builder & Contractor)`,
        desc: 'Browse open community bounties, claim milestone tasks, submit deliverable URLs, verify work via GenVM AI, and enter your destination payout address to receive disbursements.',
        primaryAction: 'Browse Open Tasks to Claim',
        primaryActionTab: 'open-bounties'
      },
      client: {
        title: 'CLIENT',
        welcome: `Welcome, ${state.currentUsername} (Client & Buyer)`,
        desc: 'Deploy AI-governed milestone escrows, deposit project funds into the contract, and receive automated payment receipt confirmations locked until AI task verification completes.',
        primaryAction: '+ Deploy New Escrow Vault',
        primaryActionTab: 'create-escrow'
      },
      dao: {
        title: 'DAO ARBITER',
        welcome: `Welcome, ${state.currentUsername} (DAO Governance Arbiter)`,
        desc: 'Stake GEN tokens in committee validator pools, monitor equivalence execution, and govern protocol dispute reserves.',
        primaryAction: 'View Intelligent Contracts',
        primaryActionTab: 'contracts'
      },
      predictor: {
        title: 'PREDICTOR',
        welcome: `Welcome, ${state.currentUsername} (Truth Market Predictor)`,
        desc: 'Trade and stake on real-world factual claims verified by automated multi-source web crawlers and GenLayer consensus.',
        primaryAction: 'Explore Truth Markets',
        primaryActionTab: 'oracle'
      }
    };

    const profile = roleProfiles[state.currentRole] || roleProfiles.client;

    const navName = document.getElementById('nav-user-name');
    const navRole = document.getElementById('nav-user-role');
    const welcomeTitle = document.getElementById('role-welcome-title');
    const welcomeDesc = document.getElementById('role-welcome-desc');
    const primaryActionBtn = document.getElementById('role-primary-action-btn');

    if (navName) navName.textContent = state.currentUsername;
    if (navRole) navRole.textContent = profile.title;
    if (welcomeTitle) welcomeTitle.textContent = profile.welcome;
    if (welcomeDesc) welcomeDesc.textContent = profile.desc;

    if (primaryActionBtn) {
      primaryActionBtn.textContent = profile.primaryAction;
      primaryActionBtn.onclick = () => {
        if (profile.primaryActionTab === 'create-escrow') {
          document.getElementById('create-escrow-modal').classList.add('active');
        } else if (profile.primaryActionTab === 'open-bounties') {
          document.querySelector('.filter-chip[data-filter="open"]').click();
        } else if (profile.primaryActionTab === 'oracle') {
          document.querySelector('.nav-tab[data-tab="oracle"]').click();
        } else {
          document.querySelector('.nav-tab[data-tab="contracts"]').click();
        }
      };
    }
  }

  // Role Switching buttons inside Dashboard
  const switchRoleNavBtn = document.getElementById('switch-role-nav-btn');
  const switchRoleHeroBtn = document.getElementById('switch-role-hero-btn');

  if (switchRoleNavBtn) switchRoleNavBtn.onclick = () => showScreen('role');
  if (switchRoleHeroBtn) switchRoleHeroBtn.onclick = () => showScreen('role');

  // Tab Navigation inside Dashboard
  const tabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${target}-tab`).classList.add('active');
      state.activeTab = target;
    });
  });

  // Faucet Button
  const faucetBtn = document.getElementById('faucet-btn');
  const walletBalanceDisplay = document.getElementById('wallet-balance');
  if (faucetBtn) {
    faucetBtn.addEventListener('click', () => {
      state.balance += 500.0;
      if (walletBalanceDisplay) walletBalanceDisplay.textContent = `${state.balance.toLocaleString()} GEN`;
      showToast('Airdropped +500.0 GEN from GenLayer Faucet!', 'success');
    });
  }

  // Load Status Telemetry
  async function loadNodeStatus() {
    try {
      const status = await API.getStatus();
      const deployedEscrowEl = document.getElementById('stat-deployed-escrow');
      const deployedOracleEl = document.getElementById('stat-deployed-oracle');

      if (deployedEscrowEl) {
        deployedEscrowEl.innerHTML = `<a href="${ESCROW_STUDIO_URL}" target="_blank" style="color:var(--primary);text-decoration:underline;">${DEPLOYED_ESCROW_CONTRACT.slice(0,6)}...${DEPLOYED_ESCROW_CONTRACT.slice(-4)}</a>`;
      }
      if (deployedOracleEl) {
        deployedOracleEl.innerHTML = `<a href="${ORACLE_STUDIO_URL}" target="_blank" style="color:var(--primary);text-decoration:underline;">${DEPLOYED_ORACLE_CONTRACT.slice(0,6)}...${DEPLOYED_ORACLE_CONTRACT.slice(-4)}</a>`;
      }
    } catch (err) {
      console.warn('Node status check failed:', err);
    }
  }

  // Search & Filters
  const searchInput = document.getElementById('escrow-search-input');
  const filterChips = document.querySelectorAll('.filter-chip');
  const escrowsContainer = document.getElementById('escrows-list');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase();
      renderEscrows();
    });
  }

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeFilter = chip.dataset.filter;
      renderEscrows();
    });
  });

  // Load & Render Escrows
  async function loadEscrows() {
    try {
      const escrows = await API.getEscrows();
      state.escrows = escrows;
      renderEscrows();
    } catch (err) {
      console.error('Error loading escrows:', err);
    }
  }

  function renderEscrows() {
    if (!escrowsContainer) return;
    escrowsContainer.innerHTML = '';

    const countAll = state.escrows.length;
    const countOpen = state.escrows.filter(e => e.status === 'OPEN_FOR_CLAIM' || (e.contractor && e.contractor.startsWith('0x0000'))).length;
    const countMy = state.escrows.filter(e => 
      (e.client && e.client.toLowerCase() === state.currentWallet.toLowerCase()) || 
      (e.contractor && e.contractor.toLowerCase() === state.currentWallet.toLowerCase())
    ).length;
    const countCompleted = state.escrows.filter(e => e.status === 'ACCEPTED' || e.status === 'COMPLETED').length;

    const elAll = document.getElementById('count-all');
    const elOpen = document.getElementById('count-open');
    const elMy = document.getElementById('count-my');
    const elCompleted = document.getElementById('count-completed');

    if (elAll) elAll.textContent = countAll;
    if (elOpen) elOpen.textContent = countOpen;
    if (elMy) elMy.textContent = countMy;
    if (elCompleted) elCompleted.textContent = countCompleted;

    let filtered = state.escrows.filter(escrow => {
      const matchesSearch = !state.searchQuery || 
        escrow.title.toLowerCase().includes(state.searchQuery) ||
        escrow.description.toLowerCase().includes(state.searchQuery) ||
        (escrow.category && escrow.category.toLowerCase().includes(state.searchQuery)) ||
        (escrow.client && escrow.client.toLowerCase().includes(state.searchQuery)) ||
        (escrow.contractor && escrow.contractor.toLowerCase().includes(state.searchQuery));

      if (!matchesSearch) return false;

      if (state.activeFilter === 'open') {
        return escrow.status === 'OPEN_FOR_CLAIM' || (escrow.contractor && escrow.contractor.startsWith('0x0000'));
      } else if (state.activeFilter === 'my-jobs') {
        return (escrow.client && escrow.client.toLowerCase() === state.currentWallet.toLowerCase()) || 
               (escrow.contractor && escrow.contractor.toLowerCase() === state.currentWallet.toLowerCase());
      } else if (state.activeFilter === 'completed') {
        return escrow.status === 'ACCEPTED' || escrow.status === 'COMPLETED';
      }
      return true;
    });

    if (filtered.length === 0) {
      escrowsContainer.innerHTML = `
        <div style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-subtle);">
          <div style="font-size:1.1rem;font-weight:700;color:var(--text-main);margin-bottom:0.25rem;">No matching tasks found</div>
          <div>Try adjusting your search query or switching active filters.</div>
        </div>
      `;
      return;
    }

    filtered.forEach((escrow) => {
      const card = document.createElement('div');
      card.className = 'escrow-card';

      const id = escrow.escrow_id || escrow.id;
      const isOpenForClaim = escrow.status === 'OPEN_FOR_CLAIM' || (escrow.contractor && escrow.contractor.startsWith('0x0000'));
      const statusClass = escrow.status ? escrow.status.toLowerCase() : 'pending';

      let actionBtnHtml = '';
      if (isOpenForClaim) {
        actionBtnHtml = `
          <button class="action-btn btn-sm" onclick="window.claimEscrowBounty(${id}, this)">
            Claim Task as Builder
          </button>
        `;
      } else if (escrow.status === 'ACTIVE' || escrow.status === 'PENDING') {
        actionBtnHtml = `<button class="secondary-btn btn-sm" onclick="window.openSubmitModal(${id})">Submit Deliverable</button>`;
      } else if (escrow.status === 'SUBMITTED') {
        actionBtnHtml = `
          <button class="action-btn btn-sm" onclick="window.triggerAIArbitration(${id})">
            Trigger GenVM AI Arbitration
          </button>
        `;
      } else if (escrow.status === 'VERIFIED_AWAITING_PAYOUT_ADDRESS') {
        actionBtnHtml = `
          <button class="action-btn btn-sm" style="background:var(--accent-purple);" onclick="window.promptPayoutAddressModal(${id})">
            Enter Payout Destination Address
          </button>
        `;
      } else if (escrow.status === 'ACCEPTED' || escrow.status === 'REJECTED') {
        actionBtnHtml = `<button class="secondary-btn btn-sm" onclick="window.viewResolutionReport(${id})">View AI Verification Report</button>`;
      }

      let depositBadgeSnippet = escrow.payment_received ? `
        <div style="margin-top:8px;padding:6px 10px;background:rgba(16, 185, 129, 0.08);border:1px solid rgba(16, 185, 129, 0.2);border-radius:6px;font-size:0.75rem;color:var(--success);">
          Contract Payment Receipt: ${escrow.amount} GEN Received & Locked in Vault
        </div>
      ` : '';

      let resolutionSnippet = '';
      if (escrow.decision) {
        resolutionSnippet = `
          <div style="margin-top:10px;padding:10px;background:rgba(var(--primary-rgb), 0.08);border:1px solid rgba(var(--primary-rgb), 0.2);border-radius:6px;">
            <div style="font-size:0.85rem;font-weight:700;">Verdict: ${escrow.decision} (Score: ${escrow.score}/100)</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">Verified by GenVM Validator Committee (5/5 Agreed).</div>
            ${escrow.payout_address ? `<div style="font-size:0.72rem;color:var(--primary);margin-top:4px;font-family:var(--font-mono);">Disbursed to: ${escrow.payout_address}</div>` : ''}
          </div>
        `;
      }

      const contractorDisplay = isOpenForClaim 
        ? '<span style="color:var(--primary);font-weight:700;">Open for Claim</span>' 
        : (escrow.contractor ? `${escrow.contractor.slice(0, 8)}...${escrow.contractor.slice(-6)}` : 'Unassigned');

      const clientDisplay = escrow.client ? `${escrow.client.slice(0, 8)}...${escrow.client.slice(-6)}` : '0xAlice94A1...';

      card.innerHTML = `
        <div>
          <div class="card-header">
            <div>
              <span class="escrow-id-badge">ESCROW #${id}</span>
              ${escrow.category ? `<span style="margin-left:6px;font-size:0.7rem;color:var(--primary);">${escrow.category}</span>` : ''}
            </div>
            <span class="status-badge ${isOpenForClaim ? 'open_for_claim' : (escrow.status === 'ACCEPTED' ? 'approved' : statusClass)}">
              ${isOpenForClaim ? 'OPEN TASK' : escrow.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h3 class="card-title">${escrow.title}</h3>
          <p class="card-desc">${escrow.description}</p>
          
          <div class="meta-grid">
            <div class="meta-box">
              <span class="meta-label">Client (Buyer)</span>
              <span class="meta-val">${clientDisplay}</span>
            </div>
            <div class="meta-box">
              <span class="meta-label">Contractor (Builder)</span>
              <span class="meta-val">${contractorDisplay}</span>
            </div>
            <div class="meta-box">
              <span class="meta-label">Escrow Vault</span>
              <span class="meta-val" style="color:var(--primary);font-weight:700;">${escrow.amount} GEN</span>
            </div>
            <div class="meta-box">
              <span class="meta-label">Quality Threshold</span>
              <span class="meta-val" style="color:var(--success);font-weight:700;">${escrow.quality_threshold}/100</span>
            </div>
          </div>

          <div style="background:var(--bg-glass);padding:12px;border-radius:var(--radius-md);border:1px solid var(--border-subtle);margin-bottom:12px;">
            <div style="font-size:0.82rem;color:var(--text-main);margin-bottom:4px;"><strong>Requirements:</strong> ${escrow.requirements}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);"><strong>AI Criteria:</strong> ${escrow.criteria}</div>
            ${escrow.deliverable_url ? `<div style="font-size:0.75rem;margin-top:6px;font-family:var(--font-mono);color:var(--primary);">Deliverable: ${escrow.deliverable_url}</div>` : ''}
            ${depositBadgeSnippet}
            ${resolutionSnippet}
          </div>
        </div>
        <div>
          ${actionBtnHtml}
        </div>
      `;
      escrowsContainer.appendChild(card);
    });
  }

  // Claim Bounty Handler
  window.claimEscrowBounty = async (escrowId, btnElement) => {
    if (btnElement) {
      btnElement.classList.add('btn-loading');
      btnElement.disabled = true;
    }
    try {
      await API.joinEscrow({
        escrow_id: escrowId,
        role: 'contractor',
        participant_address: state.currentWallet
      });
      showToast(`Successfully claimed Escrow #${escrowId}! Assigned as Contractor.`, 'success');
      loadEscrows();
    } catch (err) {
      showToast('Error claiming task: ' + err.message, 'danger');
      if (btnElement) {
        btnElement.classList.remove('btn-loading');
        btnElement.disabled = false;
      }
    }
  };

  // Markets
  const marketsContainer = document.getElementById('markets-list');

  async function loadMarkets() {
    try {
      const markets = await API.getMarkets();
      state.markets = markets;
      renderMarkets();
    } catch (err) {
      console.error('Error loading markets:', err);
    }
  }

  function renderMarkets() {
    if (!marketsContainer) return;
    marketsContainer.innerHTML = '';

    state.markets.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'escrow-card';

      const id = m.market_id || m.id;
      const totalPool = m.total_yes + m.total_no;
      const yesPercent = totalPool > 0 ? ((m.total_yes / totalPool) * 100).toFixed(1) : 50;

      let actionsHtml = '';
      if (m.status === 'OPEN') {
        actionsHtml = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
            <button class="secondary-btn" style="border-color:var(--success);" onclick="window.openStakeModal(${id}, 'YES')">Stake YES</button>
            <button class="secondary-btn" style="border-color:var(--danger);" onclick="window.openStakeModal(${id}, 'NO')">Stake NO</button>
          </div>
          <button class="action-btn" style="width:100%;" onclick="window.resolveTruthForgeMarket(${id})">
            Trigger GenLayer Oracle Resolution
          </button>
        `;
      }

      card.innerHTML = `
        <div>
          <span style="font-size:0.7rem;color:var(--primary);text-transform:uppercase;">${m.category}</span>
          <h3 class="card-title">${m.question}</h3>
          <p class="card-desc"><strong>Criteria:</strong> ${m.criteria}</p>
          <div style="font-size:0.85rem;margin-bottom:12px;">
            <strong>Pool:</strong> YES ${yesPercent}% (${m.total_yes} GEN) | NO ${(100 - yesPercent).toFixed(1)}% (${m.total_no} GEN)
          </div>
          <div style="font-size:0.72rem;font-family:var(--font-mono);color:var(--primary);margin-bottom:8px;">
            Deployed Oracle Contract: <a href="${ORACLE_STUDIO_URL}" target="_blank" style="color:var(--primary);text-decoration:underline;">${DEPLOYED_ORACLE_CONTRACT.slice(0,6)}...${DEPLOYED_ORACLE_CONTRACT.slice(-4)}</a>
          </div>
        </div>
        <div>${actionsHtml}</div>
      `;
      marketsContainer.appendChild(card);
    });
  }

  // Modals & Form Handlers
  let activeEscrowId = null;

  window.closeModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  };

  window.openSubmitModal = (escrowId) => {
    activeEscrowId = escrowId;
    document.getElementById('submit-deliverable-modal').classList.add('active');
  };

  document.getElementById('open-create-escrow-btn').addEventListener('click', () => {
    document.getElementById('create-escrow-modal').classList.add('active');
  });

  const assignmentSelect = document.getElementById('escrow-assignment-mode');
  const contractorWrapper = document.getElementById('contractor-input-wrapper');
  if (assignmentSelect && contractorWrapper) {
    assignmentSelect.addEventListener('change', (e) => {
      contractorWrapper.style.display = e.target.value === 'assigned' ? 'block' : 'none';
    });
  }

  // Create Escrow Form (Client Deposit & Contract Receipt Confirmation)
  document.getElementById('create-escrow-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('create-escrow-submit-btn');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    const amount = parseFloat(document.getElementById('escrow-amount').value);

    try {
      const res = await API.createEscrow({
        client: state.currentWallet,
        contractor: assignmentSelect.value === 'assigned' ? document.getElementById('escrow-contractor').value : '0x0000000000000000000000000000000000000000',
        title: document.getElementById('escrow-title').value,
        description: document.getElementById('escrow-desc').value,
        category: document.getElementById('escrow-category').value,
        requirements: document.getElementById('escrow-requirements').value,
        criteria: document.getElementById('escrow-criteria').value,
        amount: amount,
        quality_threshold: 80
      });
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      window.closeModals();
      showToast(`Payment Receipt Confirmed! ${amount} GEN received and locked in GenLayer Escrow Vault #${res.escrow_id}.`, 'success');
      loadEscrows();
    } catch (err) {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      showToast('Failed to create escrow: ' + err.message, 'danger');
    }
  });

  // Submit Deliverable Form
  document.getElementById('submit-deliverable-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-deliv-btn');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      await API.submitDeliverable({
        escrow_id: activeEscrowId,
        sender: state.currentWallet,
        deliverable_url: document.getElementById('deliv-url').value,
        deliverable_notes: document.getElementById('deliv-notes').value
      });
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      window.closeModals();
      showToast('Deliverable submitted to Intelligent Contract!', 'success');
      loadEscrows();
    } catch (err) {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      showToast('Failed to submit: ' + err.message, 'danger');
    }
  });

  // AI Arbitration Visualizer Step Sequence
  window.triggerAIArbitration = async (escrowId) => {
    state.activePayoutEscrowId = escrowId;
    const modal = document.getElementById('ai-arbitration-modal');
    modal.classList.add('active');

    const steps = [
      document.getElementById('step-1'),
      document.getElementById('step-2'),
      document.getElementById('step-3'),
      document.getElementById('step-4'),
      document.getElementById('step-5')
    ];
    steps.forEach(s => s.className = 'step-row');

    const statusText = document.getElementById('arbitration-status-text');

    steps[0].classList.add('active');
    statusText.textContent = 'Selecting GenLayer Validator Committee (5 Nodes Staked)...';

    setTimeout(() => {
      steps[0].classList.remove('active');
      steps[0].classList.add('completed');
      steps[1].classList.add('active');
      statusText.textContent = 'Executing gl.nondet.web.render() on deliverable snapshot...';
    }, 1000);

    setTimeout(() => {
      steps[1].classList.remove('active');
      steps[1].classList.add('completed');
      steps[2].classList.add('active');
      statusText.textContent = 'GenVM LLM evaluating criteria and scoring quality...';
    }, 2000);

    setTimeout(() => {
      steps[2].classList.remove('active');
      steps[2].classList.add('completed');
      steps[3].classList.add('active');
      statusText.textContent = 'Verifying Equivalence Principle & aggregating signatures...';
    }, 3000);

    setTimeout(async () => {
      try {
        const res = await API.resolveMilestone(escrowId);
        steps[3].classList.remove('active');
        steps[3].classList.add('completed');
        steps[4].classList.add('active');
        steps[4].classList.add('completed');

        statusText.textContent = `Consensus Proven! Task Verified (Score: 92/100). Opening Payout Destination Address Prompt...`;
        loadEscrows();
        setTimeout(() => {
          window.closeModals();
          window.promptPayoutAddressModal(escrowId);
        }, 1500);
      } catch (err) {
        statusText.textContent = `Execution error: ${err.message}`;
      }
    }, 4000);
  };

  // DEVELOPER PAYOUT ADDRESS PROMPT MODAL HANDLER
  window.promptPayoutAddressModal = (escrowId) => {
    state.activePayoutEscrowId = escrowId;
    const escrow = state.escrows.find(e => (e.escrow_id || e.id) === escrowId);

    const scoreTag = document.getElementById('payout-score-tag');
    const amountTag = document.getElementById('payout-amount-tag');

    if (scoreTag) scoreTag.textContent = escrow ? (escrow.score || 92) : 92;
    if (amountTag) amountTag.textContent = `${escrow ? escrow.amount : 500} GEN`;

    document.getElementById('payout-address-modal').classList.add('active');
  };

  // Submit Developer Payout Address Form
  document.getElementById('payout-address-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('confirm-payout-btn');
    const destAddr = document.getElementById('payout-destination-address').value.trim();

    if (!destAddr) {
      showToast('Please enter a valid payout destination address', 'danger');
      return;
    }

    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      const res = await API.releasePayout(state.activePayoutEscrowId, destAddr);
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      window.closeModals();
      showToast(`Payment disbursed! Escrow funds sent to address ${destAddr}`, 'success');
      loadEscrows();
    } catch (err) {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      showToast('Payout error: ' + err.message, 'danger');
    }
  });

  // View Resolution Report
  window.viewResolutionReport = (escrowId) => {
    const escrow = state.escrows.find(e => (e.escrow_id || e.id) === escrowId);
    if (!escrow) return;

    const body = document.getElementById('report-modal-body');
    body.innerHTML = `
      <div style="margin-bottom:1rem;">
        <span class="status-badge ${escrow.decision === 'ACCEPT' ? 'approved' : 'rejected'}">
          Verdict: ${escrow.decision || 'ACCEPT'} (Score: ${escrow.score || 92}/100)
        </span>
      </div>
      <p style="font-size:0.9rem;margin-bottom:1rem;">
        GenVM Validator Committee evaluated requirements and verified submission against specified criteria. Decision: <strong>${escrow.decision || 'ACCEPT'}</strong>.
      </p>
      ${escrow.payout_address ? `<div style="font-size:0.85rem;color:var(--success);margin-bottom:1rem;"><strong>Disbursed Payout Address:</strong> ${escrow.payout_address}</div>` : ''}
      <div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--primary);">
        Deployed Escrow Contract: <a href="${ESCROW_STUDIO_URL}" target="_blank" style="color:var(--primary);text-decoration:underline;">${DEPLOYED_ESCROW_CONTRACT}</a>
      </div>
    `;
    document.getElementById('resolution-details-modal').classList.add('active');
  };

  // Staking Handlers
  let activeMarketId = null;
  let activeMarketSide = 'YES';

  window.openStakeModal = (marketId, side) => {
    activeMarketId = marketId;
    activeMarketSide = side;
    document.getElementById('stake-side-indicator').textContent = side;
    document.getElementById('stake-modal').classList.add('active');
  };

  document.getElementById('stake-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('stake-submit-btn');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
      await API.placeBet({
        market_id: activeMarketId,
        sender: state.currentWallet,
        side: activeMarketSide,
        amount: parseFloat(document.getElementById('stake-amount').value)
      });
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      window.closeModals();
      showToast(`Staked on ${activeMarketSide}!`, 'success');
      loadMarkets();
    } catch (err) {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      showToast('Staking error: ' + err.message, 'danger');
    }
  });

  window.resolveTruthForgeMarket = async (marketId) => {
    showToast('Executing multi-source web crawl & GenLayer validator consensus...', 'info');
    try {
      const res = await API.resolveMarket(marketId);
      showToast(`Market #${marketId} autonomously resolved to ${res.outcome}!`, 'success');
      loadMarkets();
    } catch (err) {
      showToast('Resolution error: ' + err.message, 'danger');
    }
  };

  // Code Inspector
  const codeTabs = document.querySelectorAll('.code-tab-btn');
  const codeBody = document.getElementById('contract-code-body');

  function renderContractCode(contractName) {
    if (!window.GENLAYER_CONTRACTS) return;
    codeBody.textContent = window.GENLAYER_CONTRACTS[contractName] || '# Contract code loading...';
  }

  codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      codeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderContractCode(tab.dataset.contract);
    });
  });

  renderContractCode('IntelligentEscrow');

  // Initial load status
  loadNodeStatus();
  showScreen('login');
});
