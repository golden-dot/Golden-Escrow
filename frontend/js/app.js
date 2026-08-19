/**
 * app.js - Main Application Controller for GenLayer Intellex Protocol
 * Persistent Session & Global Bounty Marketplace with Modernized EIP-1193 Web3 Wallet Extension Integration
 * Network: GenLayer Bradbury
 */

document.addEventListener('DOMContentLoaded', () => {
  const DEPLOYED_ESCROW_CONTRACT = "0xc40d279E9f8a48AEE0c6383A23Bf3431d0B620Ec";
  const DEPLOYED_ORACLE_CONTRACT = "0x503402BF6Ccadf366D269FE397B79c2CFfF011AC";

  const ESCROW_STUDIO_URL = `https://studio.genlayer.com/contract/${DEPLOYED_ESCROW_CONTRACT}`;
  const ORACLE_STUDIO_URL = `https://studio.genlayer.com/contract/${DEPLOYED_ORACLE_CONTRACT}`;

  // Registered Accounts Repository
  let registeredAccounts = [];
  try {
    registeredAccounts = JSON.parse(localStorage.getItem('intellex_registered_accounts')) || [];
  } catch (e) {
    registeredAccounts = [];
  }

  function saveRegisteredAccounts() {
    localStorage.setItem('intellex_registered_accounts', JSON.stringify(registeredAccounts));
  }

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
    currentRole: localStorage.getItem('intellex_role') || '',
    currentUsername: localStorage.getItem('intellex_username') || '',
    currentEmail: localStorage.getItem('intellex_email') || '',
    currentWallet: localStorage.getItem('intellex_wallet') || '',
    connectedWallet: localStorage.getItem('intellex_connected_wallet') || '',
    escrows: [],
    markets: [],
    activeTab: 'escrows',
    searchQuery: '',
    activeFilter: 'all',
    pendingDepositEscrowId: null,
    activePayoutEscrowId: null
  };

  // WALLET BRANDING METADATA
  const WALLET_METADATA = {
    metamask: {
      name: 'MetaMask',
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M21.5 7.5L13 2 12.5 5.5l5.5 3.5L21.5 7.5z" fill="#E4761E"/><path d="M2.5 7.5L11 2l.5 3.5L6 9 2.5 7.5z" fill="#E4761E"/><path d="M18.5 16.5l-3.5 5L12 18.5l-3 3-3.5-5L3 10l9 8 9-8-2.5 6.5z" fill="#E4761E"/><path d="M12 22l3-3.5-3-1-3 1 3 3.5z" fill="#D7C1B3"/></svg>`,
      color: 'rgba(228, 118, 30, 0.12)',
      borderColor: 'rgba(228, 118, 30, 0.35)',
      desc: 'Browser Extension & Mobile Wallet'
    },
    rabby: {
      name: 'Rabby Wallet',
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#8697FF"/><path d="M6 15c2-4 6-5 9-3s4 4 3 6-5 3-7 1c-1.5-1.5-3-1-5 0-1 1-1 3 0 4" stroke="#FFF" stroke-width="2" stroke-linecap="round"/></svg>`,
      color: 'rgba(134, 151, 255, 0.12)',
      borderColor: 'rgba(134, 151, 255, 0.35)',
      desc: 'Multi-Chain Game & DeFi Wallet'
    },
    coinbase: {
      name: 'Coinbase Wallet',
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="12" fill="#0052FF"/><rect x="7" y="7" width="10" height="10" rx="3" fill="#FFF"/><rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="#0052FF"/></svg>`,
      color: 'rgba(0, 82, 255, 0.12)',
      borderColor: 'rgba(0, 82, 255, 0.35)',
      desc: 'Coinbase Web3 Extension'
    },
    trust: {
      name: 'Trust Wallet',
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 3L4 7v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V7l-8-4z" fill="#0500FF"/><path d="M12 6l5 2.5v4c0 3.6-2.5 7-5 8-2.5-1-5-4.4-5-8v-4l5-2.5z" fill="#FFF"/></svg>`,
      color: 'rgba(5, 0, 255, 0.12)',
      borderColor: 'rgba(5, 0, 255, 0.35)',
      desc: 'Decentralized Crypto Wallet'
    },
    phantom: {
      name: 'Phantom Wallet',
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#AB9FF2"/><circle cx="9" cy="11" r="1.5" fill="#FFF"/><circle cx="15" cy="11" r="1.5" fill="#FFF"/><path d="M7 16c2 1 8 1 10 0" stroke="#FFF" stroke-width="2" stroke-linecap="round"/></svg>`,
      color: 'rgba(171, 159, 242, 0.12)',
      borderColor: 'rgba(171, 159, 242, 0.35)',
      desc: 'Multichain EVM & Solana Wallet'
    },
    rainbow: {
      name: 'Rainbow Wallet',
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#1A1B1E"/><path d="M4 18A8 8 0 0 1 12 10a8 8 0 0 1 8 8" stroke="#FF5E62" stroke-width="3"/><path d="M7 18a5 5 0 0 1 5-5 5 5 0 0 1 5 5" stroke="#FFD97D" stroke-width="2.5"/><path d="M10 18a2 2 0 0 1 2-2 2 2 0 0 1 2 2" stroke="#6BE585" stroke-width="2"/></svg>`,
      color: 'rgba(255, 94, 98, 0.12)',
      borderColor: 'rgba(255, 94, 98, 0.35)',
      desc: 'Fun & Simple Ethereum Wallet'
    },
    okx: {
      name: 'OKX Wallet',
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#000"/><path d="M6 6h4v4H6V6zm8 0h4v4h-4V6zm-4 4h4v4h-4v-4zm-4 4h4v4H6v-4zm8 0h4v4h-4v-4z" fill="#FFF"/></svg>`,
      color: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.25)',
      desc: 'OKX Web3 Multichain Extension'
    },
    injected: {
      name: 'Browser Web3 Provider',
      icon: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#10B981"/><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#FFF"/></svg>`,
      color: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      desc: 'EIP-1193 Standard Injected Provider'
    }
  };

  // MODERNIZED WEB3 WALLET EXTENSION DETECTION & CONNECTION ENGINE
  window.detectAvailableWallets = () => {
    const list = [];

    // 1. MetaMask
    if (window.ethereum && window.ethereum.isMetaMask && !window.ethereum.isRabby) {
      list.push({ id: 'metamask', provider: window.ethereum, installed: true });
    } else {
      list.push({ id: 'metamask', provider: null, installed: false, downloadUrl: 'https://metamask.io/download/' });
    }

    // 2. Rabby Wallet
    if (window.ethereum && window.ethereum.isRabby) {
      list.push({ id: 'rabby', provider: window.ethereum, installed: true });
    } else {
      list.push({ id: 'rabby', provider: null, installed: false, downloadUrl: 'https://rabby.io/' });
    }

    // 3. Coinbase Wallet
    if (window.ethereum && (window.ethereum.isCoinbaseWallet || window.coinbaseWalletExtension)) {
      list.push({ id: 'coinbase', provider: window.ethereum, installed: true });
    } else {
      list.push({ id: 'coinbase', provider: null, installed: false, downloadUrl: 'https://www.coinbase.com/wallet' });
    }

    // 4. Trust Wallet
    if (window.ethereum && (window.ethereum.isTrust || window.trustwallet)) {
      list.push({ id: 'trust', provider: window.trustwallet || window.ethereum, installed: true });
    } else {
      list.push({ id: 'trust', provider: null, installed: false, downloadUrl: 'https://trustwallet.com/' });
    }

    // 5. Rainbow Wallet
    if (window.ethereum && window.ethereum.isRainbow) {
      list.push({ id: 'rainbow', provider: window.ethereum, installed: true });
    }

    // 6. OKX Wallet
    if (window.okxwallet || (window.ethereum && window.ethereum.isOKXWallet)) {
      list.push({ id: 'okx', provider: window.okxwallet || window.ethereum, installed: true });
    }

    // 7. Phantom / Solflare Web3
    if (window.phantom && window.phantom.ethereum) {
      list.push({ id: 'phantom', provider: window.phantom.ethereum, installed: true });
    }

    // 8. Generic Injected Provider fallback
    if (window.ethereum && !list.some(w => w.installed && w.provider === window.ethereum)) {
      list.push({ id: 'injected', provider: window.ethereum, installed: true });
    }

    return list;
  };

  window.openConnectWalletModal = () => {
    const modal = document.getElementById('connect-wallet-modal');
    const container = document.getElementById('detected-wallets-list');
    if (!modal || !container) return;

    container.innerHTML = '';
    const wallets = window.detectAvailableWallets();

    wallets.forEach(w => {
      const meta = WALLET_METADATA[w.id] || WALLET_METADATA.injected;
      const card = document.createElement('div');
      const isThisConnected = state.connectedWallet && state.connectedWallet.length > 0;

      card.className = `modern-wallet-card ${isThisConnected ? 'is-connected' : ''}`;
      if (w.installed) {
        card.style.borderColor = meta.borderColor;
      }

      let badgeHtml = '';
      if (w.installed) {
        badgeHtml = `<span class="modern-wallet-badge installed">Installed</span>`;
      } else {
        badgeHtml = `<a href="${w.downloadUrl}" target="_blank" class="modern-wallet-badge install-link" onclick="event.stopPropagation()">Install</a>`;
      }

      card.innerHTML = `
        <div class="modern-wallet-left">
          <div class="modern-wallet-icon-box" style="background:${meta.color}">
            ${meta.icon}
          </div>
          <div class="modern-wallet-info">
            <h4>${meta.name}</h4>
            <p>${meta.desc}</p>
          </div>
        </div>
        <div>
          ${badgeHtml}
        </div>
      `;

      if (w.installed) {
        card.onclick = async () => {
          card.style.opacity = '0.6';
          await window.connectSelectedWallet(w.provider, meta.name);
          card.style.opacity = '1';
        };
      }

      container.appendChild(card);
    });

    modal.classList.add('active');
  };

  window.connectSelectedWallet = async (provider, walletName) => {
    const targetProvider = provider || window.ethereum;
    if (!targetProvider) {
      showToast(`Extension not detected. Please install ${walletName || 'a Web3 Wallet extension'}.`, 'danger');
      return;
    }

    try {
      showToast(`Requesting account access from ${walletName}...`, 'info');
      const accounts = await targetProvider.request({ method: 'eth_requestAccounts' });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        state.connectedWallet = address;
        localStorage.setItem('intellex_connected_wallet', address);

        window.updateWalletUI();
        window.closeModals();
        showToast(`Connected ${walletName}: ${address.slice(0,6)}...${address.slice(-4)}`, 'success');
      }
    } catch (err) {
      showToast(`Wallet connection error: ${err.message || 'User rejected request'}`, 'danger');
    }
  };

  window.disconnectWallet = () => {
    state.connectedWallet = '';
    localStorage.removeItem('intellex_connected_wallet');
    window.updateWalletUI();
    showToast('Wallet disconnected', 'info');
  };

  window.updateWalletUI = () => {
    const walletBtnIcon = document.getElementById('wallet-btn-icon');
    const walletBtnText = document.getElementById('wallet-btn-text');
    const walletBtn = document.getElementById('connect-wallet-btn');

    if (state.connectedWallet && state.connectedWallet.length > 0) {
      const shortAddr = `${state.connectedWallet.slice(0, 6)}...${state.connectedWallet.slice(-4)}`;
      if (walletBtnIcon) walletBtnIcon.innerHTML = `<span class="pulse-dot"></span>`;
      if (walletBtnText) walletBtnText.textContent = shortAddr;
      if (walletBtn) {
        walletBtn.className = 'connected-wallet-pill';
        walletBtn.title = `Connected Address: ${state.connectedWallet}\n(Click to disconnect/switch)`;
        walletBtn.onclick = () => {
          if (confirm(`Connected Web3 Wallet Extension Address:\n${state.connectedWallet}\n\nDo you want to disconnect?`)) {
            window.disconnectWallet();
          }
        };
      }
    } else {
      if (walletBtnIcon) walletBtnIcon.textContent = '⚡';
      if (walletBtnText) walletBtnText.textContent = 'Connect Wallet';
      if (walletBtn) {
        walletBtn.className = 'action-btn btn-sm';
        walletBtn.style.background = 'var(--primary-gradient)';
        walletBtn.style.borderColor = 'transparent';
        walletBtn.style.color = '#fff';
        walletBtn.title = 'Connect Web3 Wallet Extension';
        walletBtn.onclick = () => window.openConnectWalletModal();
      }
    }
  };

  // EIP-1193 Auto Listeners for provider account/network changes
  if (window.ethereum && window.ethereum.on) {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts && accounts.length > 0) {
        state.connectedWallet = accounts[0];
        localStorage.setItem('intellex_connected_wallet', accounts[0]);
        showToast(`Wallet account switched to: ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}`, 'info');
      } else {
        state.connectedWallet = '';
        localStorage.removeItem('intellex_connected_wallet');
      }
      window.updateWalletUI();
    });
  }

  // 1-Click Contract Address Copy Helper
  window.copyContractAddress = (address) => {
    const targetAddr = address || DEPLOYED_ESCROW_CONTRACT;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(targetAddr).then(() => {
        showToast(`Copied contract address: ${targetAddr.slice(0,6)}...${targetAddr.slice(-4)}`, 'success');
      }).catch(() => {
        showToast(`Contract address: ${targetAddr}`, 'info');
      });
    } else {
      showToast(`Contract address: ${targetAddr}`, 'info');
    }
  };

  // Screen Switcher Helper
  function showScreen(screenId) {
    let targetId = screenId;
    if (screenId === 'role') targetId = 'role-selection';
    
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`${targetId}-screen`);
    if (target) {
      target.classList.add('active');
      state.currentScreen = screenId;
      window.scrollTo(0, 0);
    } else {
      console.warn(`Screen element not found for ${targetId}-screen`);
    }
  }

  window.showScreen = showScreen;

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

  // LOGOUT BUTTON HANDLER
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('intellex_logged_in');
      localStorage.removeItem('intellex_username');
      localStorage.removeItem('intellex_role');
      localStorage.removeItem('intellex_email');

      state.currentUsername = '';
      state.currentEmail = '';
      state.currentRole = '';

      showToast('Logged out successfully', 'info');
      showScreen('login');
    });
  }

  // SCREEN 1: AUTH TAB SWITCHER
  window.switchAuthTab = (tab) => {
    const loginBtn = document.getElementById('auth-tab-login');
    const signupBtn = document.getElementById('auth-tab-signup');
    const loginForm = document.getElementById('auth-login-form');
    const signupForm = document.getElementById('auth-signup-form');

    if (tab === 'signup') {
      if (loginBtn) loginBtn.classList.remove('active');
      if (signupBtn) signupBtn.classList.add('active');
      if (loginForm) loginForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'block';
    } else {
      if (signupBtn) signupBtn.classList.remove('active');
      if (loginBtn) loginBtn.classList.add('active');
      if (signupForm) signupForm.style.display = 'none';
      if (loginForm) loginForm.style.display = 'block';
    }
  };

  // AUTH FORM 1: LOG IN TO EXISTING ACCOUNT
  const loginForm = document.getElementById('auth-login-form');
  const loginSubmitBtn = document.getElementById('login-submit-btn');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const identifier = document.getElementById('login-identifier').value.trim();
      
      if (!identifier) {
        showToast('Please enter your email or username', 'danger');
        return;
      }

      if (loginSubmitBtn) {
        loginSubmitBtn.classList.add('btn-loading');
        loginSubmitBtn.disabled = true;
      }

      setTimeout(() => {
        if (loginSubmitBtn) {
          loginSubmitBtn.classList.remove('btn-loading');
          loginSubmitBtn.disabled = false;
        }

        const cleanEmail = identifier.includes('@') ? identifier.toLowerCase() : `${identifier.toLowerCase()}@user.io`;
        const account = registeredAccounts.find(acc => acc.email === cleanEmail || acc.name.toLowerCase() === identifier.toLowerCase());

        state.currentUsername = account ? account.name : (identifier.includes('@') ? identifier.split('@')[0] : identifier);
        state.currentEmail = cleanEmail;
        state.currentWallet = cleanEmail;

        localStorage.setItem('intellex_logged_in', 'true');
        localStorage.setItem('intellex_username', state.currentUsername);
        localStorage.setItem('intellex_email', state.currentEmail);

        if (account && account.role) {
          state.currentRole = account.role;
          localStorage.setItem('intellex_role', account.role);

          showToast(`Logged in as ${state.currentUsername} (${account.role.toUpperCase()})`, 'success');
          updateRoleUI();
          window.updateWalletUI();
          showScreen('dashboard');
          loadEscrows();
          loadMarkets();
        } else {
          showToast(`Authenticated as ${state.currentUsername}`, 'success');
          showScreen('role');
        }
      }, 500);
    });
  }

  // AUTH FORM 2: CREATE NEW ACCOUNT
  const signupForm = document.getElementById('auth-signup-form');
  const signupSubmitBtn = document.getElementById('signup-submit-btn');

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = document.getElementById('signup-fullname').value.trim();
      const email = document.getElementById('signup-email').value.trim().toLowerCase();

      if (!email) {
        showToast('Please enter a valid email address', 'danger');
        return;
      }

      const existingAccount = registeredAccounts.find(acc => acc.email === email);
      if (existingAccount) {
        showToast('An account with this email already exists. Please log in instead.', 'danger');
        return;
      }

      if (signupSubmitBtn) {
        signupSubmitBtn.classList.add('btn-loading');
        signupSubmitBtn.disabled = true;
      }

      setTimeout(() => {
        if (signupSubmitBtn) {
          signupSubmitBtn.classList.remove('btn-loading');
          signupSubmitBtn.disabled = false;
        }

        const username = fullName || email.split('@')[0];
        const newAccount = {
          email: email,
          name: username,
          role: '',
          createdAt: new Date().toISOString()
        };
        registeredAccounts.push(newAccount);
        saveRegisteredAccounts();

        state.currentUsername = username;
        state.currentEmail = email;
        state.currentWallet = email;

        localStorage.setItem('intellex_logged_in', 'true');
        localStorage.setItem('intellex_username', state.currentUsername);
        localStorage.setItem('intellex_email', state.currentEmail);

        showToast(`Account created successfully for ${state.currentUsername}!`, 'success');
        showScreen('role');
      }, 600);
    });
  }

  // SCREEN 2: PERMANENT ROLE SELECTION HANDLER
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
      if (!state.currentRole) state.currentRole = 'builder';

      confirmRoleBtn.classList.add('btn-loading');
      confirmRoleBtn.disabled = true;

      setTimeout(() => {
        confirmRoleBtn.classList.remove('btn-loading');
        confirmRoleBtn.disabled = false;

        const acc = registeredAccounts.find(a => a.email === state.currentEmail || a.name.toLowerCase() === state.currentUsername.toLowerCase());
        if (acc) {
          acc.role = state.currentRole;
          saveRegisteredAccounts();
        }

        localStorage.setItem('intellex_logged_in', 'true');
        localStorage.setItem('intellex_role', state.currentRole);
        localStorage.setItem('intellex_username', state.currentUsername);
        localStorage.setItem('intellex_email', state.currentEmail);

        showToast(`Role permanently locked to: ${state.currentRole.toUpperCase()}`, 'success');
        updateRoleUI();
        window.updateWalletUI();
        showScreen('dashboard');
        loadEscrows();
        loadMarkets();
      }, 500);
    });
  }

  // SCREEN 3: DASHBOARD ROLE & NAVIGATION UI
  function updateRoleUI() {
    const username = state.currentUsername || 'User';
    const role = state.currentRole || 'client';

    const roleProfiles = {
      builder: {
        title: 'BUILDER',
        welcome: `Welcome, ${username} (Builder & Contractor)`,
        desc: 'Browse open community escrow bounties created by clients across the network, claim tasks, submit deliverables, verify work via GenVM AI, and receive payouts.',
        primaryAction: 'Browse All Open Bounties',
        primaryActionTab: 'open-bounties',
        showDeployBtn: false
      },
      client: {
        title: 'CLIENT',
        welcome: `Welcome, ${username} (Client & Buyer)`,
        desc: 'Deploy AI-governed milestone escrow bounty vaults, deposit project funds into the contract, and publicize your bounties to Builders worldwide. Your created bounties remain active for builders across sessions.',
        primaryAction: '+ Deploy New Escrow Bounty',
        primaryActionTab: 'create-escrow',
        showDeployBtn: true
      },
      dao: {
        title: 'DAO ARBITER',
        welcome: `Welcome, ${username} (DAO Governance Arbiter)`,
        desc: 'Stake GEN tokens in committee validator pools, monitor equivalence execution, and govern protocol dispute reserves on GenLayer Bradbury.',
        primaryAction: 'View Active Tasks & Equivalence',
        primaryActionTab: 'escrows',
        showDeployBtn: false
      },
      predictor: {
        title: 'PREDICTOR',
        welcome: `Welcome, ${username} (Truth Market Predictor)`,
        desc: 'Trade and stake on real-world factual claims verified by automated multi-source web crawlers and GenLayer consensus.',
        primaryAction: 'Explore Truth Markets',
        primaryActionTab: 'oracle',
        showDeployBtn: false
      }
    };

    const profile = roleProfiles[role] || roleProfiles.client;

    const navName = document.getElementById('nav-user-name');
    const navRole = document.getElementById('nav-user-role');
    const welcomeTitle = document.getElementById('role-welcome-title');
    const welcomeDesc = document.getElementById('role-welcome-desc');
    const primaryActionBtn = document.getElementById('role-primary-action-btn');
    const openCreateEscrowBtn = document.getElementById('open-create-escrow-btn');

    if (navName) navName.textContent = username;
    if (navRole) navRole.textContent = profile.title;
    if (welcomeTitle) welcomeTitle.textContent = profile.welcome;
    if (welcomeDesc) welcomeDesc.textContent = profile.desc;

    if (openCreateEscrowBtn) {
      openCreateEscrowBtn.style.display = profile.showDeployBtn ? 'inline-flex' : 'none';
    }

    if (primaryActionBtn) {
      primaryActionBtn.textContent = profile.primaryAction;
      primaryActionBtn.onclick = () => {
        if (profile.primaryActionTab === 'create-escrow') {
          document.getElementById('create-escrow-modal').classList.add('active');
        } else if (profile.primaryActionTab === 'open-bounties') {
          const chip = document.querySelector('.filter-chip[data-filter="open"]');
          if (chip) chip.click();
        } else if (profile.primaryActionTab === 'oracle') {
          const tab = document.querySelector('.nav-tab[data-tab="oracle"]');
          if (tab) tab.click();
        } else {
          const tab = document.querySelector('.nav-tab[data-tab="escrows"]');
          if (tab) tab.click();
        }
      };
    }

    if (role === 'predictor') {
      const oracleTabBtn = document.getElementById('nav-tab-oracle');
      if (oracleTabBtn) oracleTabBtn.click();
    } else if (role === 'builder') {
      state.activeFilter = 'open';
      const openChip = document.querySelector('.filter-chip[data-filter="open"]');
      if (openChip) {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        openChip.classList.add('active');
      }
    }
  }

  // Tab Navigation inside Dashboard
  const tabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const targetEl = document.getElementById(`${target}-tab`);
      if (targetEl) targetEl.classList.add('active');
      state.activeTab = target;
    });
  });

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
      let escrows = await API.getEscrows();
      if (Array.isArray(escrows)) {
        escrows = escrows.filter(e => {
          if (!e) return false;
          if (e.client === '0xAliceClient' || e.client === '0xDevinClient') return false;
          return true;
        });
      } else {
        escrows = [];
      }
      state.escrows = escrows;
      renderEscrows();
    } catch (err) {
      console.error('Error loading escrows:', err);
    }
  }

  // Listen for BroadcastChannel updates
  window.addEventListener('intellex:escrows_updated', (e) => {
    if (e.detail && Array.isArray(e.detail)) {
      state.escrows = e.detail;
      renderEscrows();
    }
  });

  window.deleteEscrowTask = async (escrowId) => {
    if (confirm(`Are you sure you want to delete Escrow Bounty #${escrowId}?`)) {
      try {
        await API.deleteEscrow(escrowId);
        showToast(`Escrow Bounty #${escrowId} deleted successfully.`, 'info');
        loadEscrows();
      } catch (e) {
        showToast('Error deleting task: ' + e.message, 'danger');
      }
    }
  };

  // BUILDER CANCEL / RELEASE CLAIMED BOUNTY
  window.cancelClaimedBounty = async (escrowId, btnElement) => {
    if (confirm(`Are you sure you want to cancel your claim on Escrow Bounty #${escrowId}? The bounty will return to the Open Marketplace for other builders.`)) {
      if (btnElement) {
        btnElement.classList.add('btn-loading');
        btnElement.disabled = true;
      }
      try {
        await API.cancelClaimedBounty(escrowId);
        showToast(`Escrow Bounty #${escrowId} claim cancelled! Returned to Open Bounty Marketplace.`, 'info');
        loadEscrows();
      } catch (err) {
        if (btnElement) {
          btnElement.classList.remove('btn-loading');
          btnElement.disabled = false;
        }
        showToast('Error cancelling claim: ' + err.message, 'danger');
      }
    }
  };

  // Publicize all unpublicized bounties for current client
  window.publicizeAllMyBounties = async (btnElement) => {
    const user = state.connectedWallet || state.currentUsername || state.currentEmail || 'Client';
    if (btnElement) {
      btnElement.classList.add('btn-loading');
      btnElement.disabled = true;
    }
    try {
      const res = await API.publicizeAllClientBounties(user);
      if (btnElement) {
        btnElement.classList.remove('btn-loading');
        btnElement.disabled = false;
      }
      showToast(`Publicized ${res.count} created bounties to Builders worldwide!`, 'success');
      loadEscrows();
    } catch (e) {
      if (btnElement) {
        btnElement.classList.remove('btn-loading');
        btnElement.disabled = false;
      }
      showToast('Error publicizing bounties: ' + e.message, 'danger');
    }
  };

  // Open Deposit Required Modal for unpaid task
  window.openDepositRequiredModal = (escrowId) => {
    const escrow = state.escrows.find(e => (e.escrow_id || e.id) == escrowId);
    if (!escrow) return;

    state.pendingDepositEscrowId = escrowId;
    const titleTag = document.getElementById('deposit-task-title');
    const amountTag = document.getElementById('deposit-task-amount');

    if (titleTag) titleTag.textContent = escrow.title;
    if (amountTag) amountTag.textContent = `${escrow.amount} GEN`;

    document.getElementById('deposit-payment-modal').classList.add('active');
  };

  function renderEscrows() {
    if (!escrowsContainer) return;
    escrowsContainer.innerHTML = '';

    const currentUser = (state.connectedWallet || state.currentUsername || '').toLowerCase();
    const currentEmail = (state.currentEmail || '').toLowerCase();
    const isBuilder = state.currentRole === 'builder';
    const isClient = state.currentRole === 'client';

    const countAll = state.escrows.filter(e => e.payment_received || e.status === 'OPEN_FOR_CLAIM' || (e.client && (e.client.toLowerCase() === currentUser || e.client.toLowerCase() === currentEmail))).length;
    const countOpen = state.escrows.filter(e => (e.status === 'OPEN_FOR_CLAIM' || !e.contractor || e.contractor.startsWith('0x0000')) && (e.payment_received || e.status === 'OPEN_FOR_CLAIM')).length;
    const countMy = state.escrows.filter(e => 
      (e.client && (e.client.toLowerCase() === currentUser || e.client.toLowerCase() === currentEmail)) || 
      (e.contractor && (e.contractor.toLowerCase() === currentUser || e.contractor.toLowerCase() === currentEmail))
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

    // Check if Client has any unpublicized created bounties
    const unpublicizedCreatedBounties = state.escrows.filter(e => {
      const cLower = (e.client || '').toLowerCase();
      const isOwner = (cLower === currentUser || cLower === currentEmail);
      return isOwner && (!e.payment_received && e.status !== 'OPEN_FOR_CLAIM');
    });

    if (isClient && unpublicizedCreatedBounties.length > 0) {
      const banner = document.createElement('div');
      banner.style.cssText = "grid-column:1/-1;margin-bottom:1rem;padding:12px 16px;background:rgba(245, 158, 11, 0.1);border:1px solid rgba(245, 158, 11, 0.3);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;";
      banner.innerHTML = `
        <div style="font-size:0.88rem;color:var(--text-main);">
          You have <strong style="color:var(--warning);">${unpublicizedCreatedBounties.length}</strong> created bounty draft(s) awaiting deposit to publicize.
        </div>
        <button class="action-btn btn-sm" onclick="window.publicizeAllMyBounties(this)">
          Publicize All My Created Bounties Now
        </button>
      `;
      escrowsContainer.appendChild(banner);
    }

    let filtered = state.escrows.filter(escrow => {
      const matchesSearch = !state.searchQuery || 
        escrow.title.toLowerCase().includes(state.searchQuery) ||
        escrow.description.toLowerCase().includes(state.searchQuery) ||
        (escrow.category && escrow.category.toLowerCase().includes(state.searchQuery)) ||
        (escrow.client && escrow.client.toLowerCase().includes(state.searchQuery)) ||
        (escrow.contractor && escrow.contractor.toLowerCase().includes(state.searchQuery));

      if (!matchesSearch) return false;

      const clientOwnerLower = (escrow.client || '').toLowerCase();
      const isCreatorOfTask = (clientOwnerLower === currentUser || clientOwnerLower === currentEmail);

      // UNPAID BOUNTIES ARE ONLY VISIBLE TO CREATOR CLIENT UNTIL DEPOSIT SENT
      if (!escrow.payment_received && !isCreatorOfTask && escrow.status !== 'OPEN_FOR_CLAIM') {
        return false;
      }

      if (state.activeFilter === 'open') {
        // OPEN BOUNTIES TAB: Show all paid or publicized bounties open for claim
        return escrow.status === 'OPEN_FOR_CLAIM' || escrow.payment_received === true;
      } else if (state.activeFilter === 'my-jobs') {
        return isCreatorOfTask || (escrow.contractor && (escrow.contractor.toLowerCase() === currentUser || escrow.contractor.toLowerCase() === currentEmail));
      } else if (state.activeFilter === 'completed') {
        return escrow.status === 'ACCEPTED' || escrow.status === 'COMPLETED';
      }

      return true;
    });

    if (filtered.length === 0 && unpublicizedCreatedBounties.length === 0) {
      escrowsContainer.innerHTML = `
        <div style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-subtle);">
          <div style="font-size:1.1rem;font-weight:700;color:var(--text-main);margin-bottom:0.25rem;">No active escrow bounties found</div>
          <div>${isClient ? 'Click "+ Deploy New Escrow Bounty" to post a task!' : 'Waiting for clients to post and deposit bounties.'}</div>
        </div>
      `;
      return;
    }

    filtered.forEach((escrow) => {
      const card = document.createElement('div');
      card.className = 'escrow-card';

      const id = escrow.escrow_id || escrow.id;
      const isOpenForClaim = (escrow.status === 'OPEN_FOR_CLAIM' || !escrow.contractor || escrow.contractor.startsWith('0x0000')) && (escrow.payment_received || escrow.status === 'OPEN_FOR_CLAIM');
      const isAwaitingDeposit = (!escrow.payment_received && escrow.status !== 'OPEN_FOR_CLAIM') || escrow.status === 'AWAITING_DEPOSIT';
      const statusClass = isAwaitingDeposit ? 'pending' : (isOpenForClaim ? 'open_for_claim' : (escrow.status === 'ACCEPTED' ? 'approved' : (escrow.status ? escrow.status.toLowerCase() : 'pending')));

      const clientOwnerLower = (escrow.client || '').toLowerCase();
      const isCreatorOfTask = (clientOwnerLower === currentUser || clientOwnerLower === currentEmail);
      const isAssignedContractor = (escrow.contractor || '').toLowerCase() === currentUser || (escrow.contractor || '').toLowerCase() === currentEmail;

      let actionBtnHtml = '';
      if (isAwaitingDeposit) {
        if (isCreatorOfTask) {
          actionBtnHtml = `
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <button class="action-btn btn-sm" style="background:var(--warning);color:#000;" onclick="window.openDepositRequiredModal(${id})">
                Deposit &amp; Publicize
              </button>
              <button class="secondary-btn btn-sm" style="border-color:var(--danger);color:var(--danger);" onclick="window.deleteEscrowTask(${id})">Delete</button>
            </div>
          `;
        }
      } else if (isOpenForClaim) {
        if (isCreatorOfTask) {
          actionBtnHtml = `
            <div style="display:flex;gap:8px;align-items:center;">
              <span style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">Created by You</span>
              <button class="secondary-btn btn-sm" style="border-color:var(--danger);color:var(--danger);" onclick="window.deleteEscrowTask(${id})">Delete</button>
            </div>
          `;
        } else {
          actionBtnHtml = `
            <button class="action-btn btn-sm" onclick="window.claimEscrowBounty(${id}, this)">
              Claim Task as Builder
            </button>
          `;
        }
      } else if (escrow.status === 'ACTIVE' || escrow.status === 'PENDING') {
        actionBtnHtml = `
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            ${isAssignedContractor ? `
              <button class="secondary-btn btn-sm" onclick="window.openSubmitModal(${id})">Submit Deliverable</button>
              <button class="secondary-btn btn-sm" style="border-color:var(--warning);color:var(--warning);" onclick="window.cancelClaimedBounty(${id}, this)">Cancel Claim</button>
            ` : ''}
            ${isCreatorOfTask ? `<button class="secondary-btn btn-sm" style="border-color:var(--danger);color:var(--danger);" onclick="window.deleteEscrowTask(${id})">Delete</button>` : ''}
          </div>
        `;
      } else if (escrow.status === 'SUBMITTED') {
        actionBtnHtml = `
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <button class="action-btn btn-sm" onclick="window.triggerAIArbitration(${id})">
              Trigger GenVM AI Arbitration
            </button>
            ${isAssignedContractor ? `
              <button class="secondary-btn btn-sm" style="border-color:var(--warning);color:var(--warning);" onclick="window.cancelClaimedBounty(${id}, this)">Cancel Claim</button>
            ` : ''}
          </div>
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

      let depositBadgeSnippet = (escrow.payment_received || escrow.status === 'OPEN_FOR_CLAIM') ? `
        <div style="margin-top:8px;padding:6px 10px;background:rgba(16, 185, 129, 0.08);border:1px solid rgba(16, 185, 129, 0.2);border-radius:6px;font-size:0.75rem;color:var(--success);">
          Contract Payment Receipt: ${escrow.amount} GEN Received & Locked in Vault
        </div>
      ` : `
        <div style="margin-top:8px;padding:6px 10px;background:rgba(245, 158, 11, 0.08);border:1px solid rgba(245, 158, 11, 0.25);border-radius:6px;font-size:0.75rem;color:var(--warning);">
          Awaiting Contract Deposit (${escrow.amount} GEN) to Publicize to Builders
        </div>
      `;

      let resolutionSnippet = '';
      if (escrow.decision) {
        resolutionSnippet = `
          <div style="margin-top:10px;padding:10px;background:rgba(var(--primary-rgb), 0.08);border:1px solid rgba(var(--primary-rgb), 0.2);border-radius:6px;">
            <div style="font-size:0.85rem;font-weight:700;">Verdict: ${escrow.decision} (Score: ${escrow.score}/100)</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">Verified by GenVM Validator Committee on Bradbury.</div>
            ${escrow.payout_address ? `<div style="font-size:0.72rem;color:var(--primary);margin-top:4px;font-family:var(--font-mono);">Disbursed to: ${escrow.payout_address}</div>` : ''}
          </div>
        `;
      }

      const contractorDisplay = isOpenForClaim 
        ? '<span style="color:var(--primary);font-weight:700;">Open for Claim</span>' 
        : (escrow.contractor && !escrow.contractor.startsWith('0x0000') ? `${escrow.contractor}` : 'Unassigned');

      const clientDisplay = escrow.client ? escrow.client : 'Client';

      card.innerHTML = `
        <div>
          <div class="card-header">
            <div>
              <span class="escrow-id-badge">ESCROW BOUNTY #${id}</span>
              ${escrow.category ? `<span style="margin-left:6px;font-size:0.7rem;color:var(--primary);">${escrow.category}</span>` : ''}
            </div>
            <span class="status-badge ${isAwaitingDeposit ? 'pending' : (isOpenForClaim ? 'open_for_claim' : (escrow.status === 'ACCEPTED' ? 'approved' : statusClass))}">
              ${isAwaitingDeposit ? 'AWAITING DEPOSIT' : (isOpenForClaim ? 'PUBLICIZED BOUNTY' : escrow.status.replace(/_/g, ' '))}
            </span>
          </div>
          <h3 class="card-title">${escrow.title}</h3>
          <p class="card-desc">${escrow.description}</p>
          
          <div class="meta-grid">
            <div class="meta-box">
              <span class="meta-label">Client (Creator)</span>
              <span class="meta-val" style="font-weight:600;">${clientDisplay}</span>
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
    const escrow = state.escrows.find(e => (e.escrow_id || e.id) == escrowId);
    if (escrow) {
      const clientOwnerLower = (escrow.client || '').toLowerCase();
      const currentUser = (state.connectedWallet || state.currentUsername || '').toLowerCase();
      const currentEmail = (state.currentEmail || '').toLowerCase();

      if (clientOwnerLower === currentUser || clientOwnerLower === currentEmail) {
        showToast('You cannot claim your own bounty task!', 'danger');
        return;
      }
    }

    if (btnElement) {
      btnElement.classList.add('btn-loading');
      btnElement.disabled = true;
    }
    try {
      await API.joinEscrow({
        escrow_id: escrowId,
        role: 'contractor',
        participant_address: state.connectedWallet || state.currentUsername || state.currentEmail || "Builder"
      });
      showToast(`Successfully claimed Escrow Bounty #${escrowId}! Assigned as Contractor.`, 'success');
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

    if (state.markets.length === 0) {
      marketsContainer.innerHTML = `
        <div style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-subtle);">
          <div style="font-size:1.1rem;font-weight:700;color:var(--text-main);margin-bottom:0.25rem;">No active truth markets</div>
          <div>Click "+ Create Truth Market" to deploy a fact verification market on GenLayer Bradbury!</div>
        </div>
      `;
      return;
    }

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
  window.closeModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  };

  window.openSubmitModal = (escrowId) => {
    state.activePayoutEscrowId = escrowId;
    document.getElementById('submit-deliverable-modal').classList.add('active');
  };

  const openCreateBtn = document.getElementById('open-create-escrow-btn');
  if (openCreateBtn) {
    openCreateBtn.addEventListener('click', () => {
      document.getElementById('create-escrow-modal').classList.add('active');
    });
  }

  const openCreateMarketBtn = document.getElementById('open-create-market-btn');
  if (openCreateMarketBtn) {
    openCreateMarketBtn.addEventListener('click', () => {
      document.getElementById('create-market-modal').classList.add('active');
    });
  }

  const assignmentSelect = document.getElementById('escrow-assignment-mode');
  const contractorWrapper = document.getElementById('contractor-input-wrapper');
  if (assignmentSelect && contractorWrapper) {
    assignmentSelect.addEventListener('change', (e) => {
      contractorWrapper.style.display = e.target.value === 'assigned' ? 'block' : 'none';
    });
  }

  // Create Escrow Form
  const createEscrowForm = document.getElementById('create-escrow-form');
  if (createEscrowForm) {
    createEscrowForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('create-escrow-submit-btn');
      if (btn) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
      }

      const amount = parseFloat(document.getElementById('escrow-amount').value) || 100;
      const clientAddr = state.connectedWallet || state.currentUsername || state.currentEmail || "Client";

      try {
        const res = await API.createEscrow({
          client: clientAddr,
          contractor: assignmentSelect && assignmentSelect.value === 'assigned' ? document.getElementById('escrow-contractor').value : '0x0000000000000000000000000000000000000000',
          title: document.getElementById('escrow-title').value,
          description: document.getElementById('escrow-desc').value,
          category: document.getElementById('escrow-category').value,
          requirements: document.getElementById('escrow-requirements').value,
          criteria: document.getElementById('escrow-criteria').value,
          amount: amount,
          quality_threshold: 80,
          publicize_now: true
        });
        if (btn) {
          btn.classList.remove('btn-loading');
          btn.disabled = false;
        }
        window.closeModals();
        loadEscrows();

        showToast(`Deployed & Publicized Escrow Bounty #${res.escrow_id} via Web3 Wallet!`, 'success');
      } catch (err) {
        if (btn) {
          btn.classList.remove('btn-loading');
          btn.disabled = false;
        }
        showToast('Failed to create escrow: ' + err.message, 'danger');
      }
    });
  }

  // CONFIRM DEPOSIT PAYMENT SENT BUTTON HANDLER
  const confirmDepositSentBtn = document.getElementById('confirm-deposit-sent-btn');
  if (confirmDepositSentBtn) {
    confirmDepositSentBtn.addEventListener('click', async () => {
      if (!state.pendingDepositEscrowId) return;

      confirmDepositSentBtn.classList.add('btn-loading');
      confirmDepositSentBtn.disabled = true;

      try {
        const res = await API.confirmEscrowDeposit(state.pendingDepositEscrowId);
        confirmDepositSentBtn.classList.remove('btn-loading');
        confirmDepositSentBtn.disabled = false;
        window.closeModals();

        showToast(`Wallet Extension Confirmation Verified! Escrow Bounty #${state.pendingDepositEscrowId} is PUBLICIZED!`, 'success');
        loadEscrows();
      } catch (e) {
        confirmDepositSentBtn.classList.remove('btn-loading');
        confirmDepositSentBtn.disabled = false;
        showToast('Wallet confirmation error: ' + e.message, 'danger');
      }
    });
  }

  // Create Market Form
  const createMarketForm = document.getElementById('create-market-form');
  if (createMarketForm) {
    createMarketForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = createMarketForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
      }

      try {
        const question = document.getElementById('market-question').value;
        const category = document.getElementById('market-category').value;
        const criteria = document.getElementById('market-criteria').value;
        const sourcesText = document.getElementById('market-sources').value;
        const sources = sourcesText ? sourcesText.split('\n').filter(s => s.trim().length > 0) : [];

        const res = await API.createMarket({
          creator: state.connectedWallet || state.currentUsername || state.currentEmail || "Predictor",
          question: question,
          category: category,
          resolution_criteria: criteria,
          resolution_sources: sources
        });

        if (btn) {
          btn.classList.remove('btn-loading');
          btn.disabled = false;
        }
        window.closeModals();
        showToast(`Truth Market #${res.market_id} deployed on GenLayer Bradbury!`, 'success');
        loadMarkets();
      } catch (err) {
        if (btn) {
          btn.classList.remove('btn-loading');
          btn.disabled = false;
        }
        showToast('Failed to create market: ' + err.message, 'danger');
      }
    });
  }

  // Submit Deliverable Form
  const submitDelivForm = document.getElementById('submit-deliverable-form');
  if (submitDelivForm) {
    submitDelivForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submit-deliv-btn');
      if (btn) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
      }

      try {
        await API.submitDeliverable({
          escrow_id: state.activePayoutEscrowId,
          sender: state.connectedWallet || state.currentUsername || state.currentEmail || "Builder",
          deliverable_url: document.getElementById('deliv-url').value,
          deliverable_notes: document.getElementById('deliv-notes').value
        });
        if (btn) {
          btn.classList.remove('btn-loading');
          btn.disabled = false;
        }
        window.closeModals();
        showToast('Deliverable submitted to Intelligent Contract!', 'success');
        loadEscrows();
      } catch (err) {
        if (btn) {
          btn.classList.remove('btn-loading');
          btn.disabled = false;
        }
        showToast('Failed to submit: ' + err.message, 'danger');
      }
    });
  }

  // AI ARBITRATION VISUALIZER
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
    steps.forEach(s => { if (s) s.className = 'step-row'; });

    const statusText = document.getElementById('arbitration-status-text');

    if (steps[0]) steps[0].classList.add('active');
    if (statusText) statusText.textContent = 'Selecting GenLayer Validator Committee (5 Nodes Staked)...';

    setTimeout(() => {
      if (steps[0]) { steps[0].classList.remove('active'); steps[0].classList.add('completed'); }
      if (steps[1]) steps[1].classList.add('active');
      if (statusText) statusText.textContent = 'Executing gl.nondet.web.render() on deliverable snapshot...';
    }, 1000);

    setTimeout(() => {
      if (steps[1]) { steps[1].classList.remove('active'); steps[1].classList.add('completed'); }
      if (steps[2]) steps[2].classList.add('active');
      if (statusText) statusText.textContent = 'GenVM LLM evaluating criteria and scoring quality...';
    }, 2000);

    setTimeout(() => {
      if (steps[2]) { steps[2].classList.remove('active'); steps[2].classList.add('completed'); }
      if (steps[3]) steps[3].classList.add('active');
      if (statusText) statusText.textContent = 'Verifying Equivalence Principle & aggregating signatures...';
    }, 3000);

    setTimeout(async () => {
      try {
        const res = await API.resolveMilestone(escrowId);
        if (steps[3]) { steps[3].classList.remove('active'); steps[3].classList.add('completed'); }
        if (steps[4]) { steps[4].classList.add('active'); steps[4].classList.add('completed'); }

        if (res.decision === 'ACCEPT') {
          if (statusText) statusText.textContent = `Consensus Proven! Task Verified (Score: ${res.resolution ? res.resolution.score : 92}/100). Opening Payout Destination Address Prompt...`;
          loadEscrows();
          setTimeout(() => {
            window.closeModals();
            window.promptPayoutAddressModal(escrowId);
          }, 1500);
        } else {
          // REJECTED -> Reset to OPEN_FOR_CLAIM
          const target = state.escrows.find(e => (e.escrow_id || e.id) == escrowId);
          if (target) {
            target.status = 'OPEN_FOR_CLAIM';
            target.contractor = '0x0000000000000000000000000000000000000000';
            target.deliverable_url = '';
            target.deliverable_notes = '';
          }
          if (statusText) statusText.textContent = `Verification REJECTED. Task returned to Open Bounty Marketplace for other builders!`;
          loadEscrows();
          setTimeout(() => {
            window.closeModals();
          }, 2000);
        }
      } catch (err) {
        if (statusText) statusText.textContent = `Execution error: ${err.message}`;
      }
    }, 4000);
  };

  // DEVELOPER PAYOUT ADDRESS PROMPT MODAL HANDLER
  window.promptPayoutAddressModal = (escrowId) => {
    state.activePayoutEscrowId = escrowId;
    const escrow = state.escrows.find(e => (e.escrow_id || e.id) == escrowId);

    const scoreTag = document.getElementById('payout-score-tag');
    const amountTag = document.getElementById('payout-amount-tag');

    if (scoreTag) scoreTag.textContent = escrow ? (escrow.score || 92) : 92;
    if (amountTag) amountTag.textContent = `${escrow ? escrow.amount : 500} GEN`;

    const payoutInput = document.getElementById('payout-destination-address');
    if (payoutInput && state.connectedWallet) {
      payoutInput.value = state.connectedWallet;
    }

    document.getElementById('payout-address-modal').classList.add('active');
  };

  // Submit Developer Payout Address Form
  const payoutAddressForm = document.getElementById('payout-address-form');
  if (payoutAddressForm) {
    payoutAddressForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('confirm-payout-btn');
      const destAddr = document.getElementById('payout-destination-address').value.trim();

      if (!destAddr) {
        showToast('Please enter a valid payout destination address', 'danger');
        return;
      }

      if (btn) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
      }

      try {
        const res = await API.releasePayout(state.activePayoutEscrowId, destAddr);
        if (btn) {
          btn.classList.remove('btn-loading');
          btn.disabled = false;
        }
        window.closeModals();
        showToast(`Payment disbursed! Escrow funds sent to address ${destAddr}`, 'success');
        loadEscrows();
      } catch (err) {
        if (btn) {
          btn.classList.remove('btn-loading');
          btn.disabled = false;
        }
        showToast('Payout error: ' + err.message, 'danger');
      }
    });
  }

  // View Resolution Report
  window.viewResolutionReport = (escrowId) => {
    const escrow = state.escrows.find(e => (e.escrow_id || e.id) == escrowId);
    if (!escrow) return;

    const body = document.getElementById('report-modal-body');
    body.innerHTML = `
      <div style="margin-bottom:1rem;">
        <span class="status-badge ${escrow.decision === 'ACCEPT' ? 'approved' : 'rejected'}">
          Verdict: ${escrow.decision || 'ACCEPT'} (Score: ${escrow.score || 92}/100)
        </span>
      </div>
      <p style="font-size:0.9rem;margin-bottom:1rem;">
        GenVM Validator Committee on GenLayer Bradbury evaluated requirements and verified submission against specified criteria. Decision: <strong>${escrow.decision || 'ACCEPT'}</strong>.
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

  const stakeForm = document.getElementById('stake-form');
  if (stakeForm) {
    stakeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('stake-submit-btn');
      if (btn) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
      }

      try {
        await API.placeBet({
          market_id: activeMarketId,
          sender: state.connectedWallet || state.currentUsername || state.currentEmail || "Predictor",
          side: activeMarketSide,
          amount: parseFloat(document.getElementById('stake-amount').value)
        });
        if (btn) {
          btn.classList.remove('btn-loading');
          btn.disabled = false;
        }
        window.closeModals();
        showToast(`Staked on ${activeMarketSide}!`, 'success');
        loadMarkets();
      } catch (err) {
        if (btn) {
          btn.classList.remove('btn-loading');
          btn.disabled = false;
        }
        showToast('Staking error: ' + err.message, 'danger');
      }
    });
  }

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

  // LIVE AUTO-REFRESH POLLING EVERY 1 SECOND (1000ms)
  setInterval(() => {
    if (state.currentScreen === 'dashboard') {
      loadEscrows();
    }
  }, 1000);

  // INITIALIZE SESSION RESTORATION ON PAGE REFRESH
  loadNodeStatus();
  window.updateWalletUI();

  const isAlreadyLoggedIn = localStorage.getItem('intellex_logged_in') === 'true';
  const savedRole = localStorage.getItem('intellex_role');
  const savedUsername = localStorage.getItem('intellex_username');
  const savedEmail = localStorage.getItem('intellex_email');

  if (isAlreadyLoggedIn && savedUsername && savedRole) {
    state.currentUsername = savedUsername;
    state.currentEmail = savedEmail || `${savedUsername.toLowerCase()}@user.io`;
    state.currentWallet = state.currentEmail;
    state.currentRole = savedRole;

    updateRoleUI();
    window.updateWalletUI();
    showScreen('dashboard');
    loadEscrows();
    loadMarkets();
  } else {
    showScreen('login');
  }
});
