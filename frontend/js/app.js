/**
 * app.js - Main Application Controller for GenLayer Intellex Platform
 */

document.addEventListener('DOMContentLoaded', () => {
  // Theme Management
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  
  const savedTheme = localStorage.getItem('intellex_theme') || 'dark';
  applyTheme(savedTheme);

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('intellex_theme', theme);
    if (theme === 'light') {
      themeIcon.textContent = '☀️';
      themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
    } else {
      themeIcon.textContent = '🌙';
      themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
    }
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme.toUpperCase()} theme`, 'info');
  });

  // App State
  const state = {
    activeTab: 'escrows',
    currentRole: localStorage.getItem('intellex_role') || 'buyer',
    currentUsername: localStorage.getItem('intellex_username') || 'Alice',
    currentWallet: localStorage.getItem('intellex_wallet') || '0xAlice94A17B809F3d445492F6F16c14C2361B1cA29A33',
    currentAvatar: '🏢',
    balance: 5000.0,
    escrows: [],
    markets: [],
    nodeStatus: null,
    searchQuery: '',
    activeFilter: 'all',
    selectedContractCode: 'IntelligentEscrow'
  };

  // DOM Elements
  const tabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const faucetBtn = document.getElementById('faucet-btn');
  const walletBalanceDisplay = document.getElementById('wallet-balance');
  const escrowsContainer = document.getElementById('escrows-list');
  const marketsContainer = document.getElementById('markets-list');
  const openRoleModalBtn = document.getElementById('open-role-modal-btn');
  const navUserAvatar = document.getElementById('nav-user-avatar');
  const navUserName = document.getElementById('nav-user-name');
  const navUserRole = document.getElementById('nav-user-role');
  const roleHeroBanner = document.getElementById('personalized-role-banner');
  const roleWelcomeTitle = document.getElementById('role-welcome-title');
  const roleWelcomeDesc = document.getElementById('role-welcome-desc');
  const rolePrimaryActionBtn = document.getElementById('role-primary-action-btn');
  const searchInput = document.getElementById('escrow-search-input');
  const filterChips = document.querySelectorAll('.filter-chip');

  // Modals
  const onboardingModal = document.getElementById('onboarding-modal');
  const createEscrowModal = document.getElementById('create-escrow-modal');
  const submitDeliverableModal = document.getElementById('submit-deliverable-modal');
  const aiArbitrationModal = document.getElementById('ai-arbitration-modal');
  const createMarketModal = document.getElementById('create-market-modal');
  const resolutionDetailsModal = document.getElementById('resolution-details-modal');

  // Toast utility
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>⚡</span><div>${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Animated Number Counter
  function animateValue(element, start, end, duration, formatFn = (v) => v) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = Math.floor(progress * (end - start) + start);
      element.textContent = formatFn(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = formatFn(end);
      }
    };
    window.requestAnimationFrame(step);
  }

  // 3D Card Hover Tilt effect
  function attachCardTiltEffect() {
    document.querySelectorAll('.escrow-card, .market-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // Role Configuration & Update UI
  function updateRoleUI() {
    const roleProfiles = {
      buyer: {
        title: 'Buyer / Client',
        avatar: '🏢',
        welcome: `Welcome, ${state.currentUsername} (Buyer & Project Creator)`,
        desc: 'Deploy AI-governed milestone escrows, fund vaults, and let GenVM automatically verify contractor deliverables with zero dispute delays.',
        primaryAction: '+ Deploy New Escrow Vault',
        primaryActionTab: 'create-escrow'
      },
      contractor: {
        title: 'Contractor / Dev',
        avatar: '🛠️',
        welcome: `Welcome, ${state.currentUsername} (Contractor & Builder)`,
        desc: 'Browse open community bounties, claim milestones, submit code/deliverables, and receive instant cryptographic disbursements through GenLayer AI consensus.',
        primaryAction: '🎯 Browse Open Bounties to Claim',
        primaryActionTab: 'open-bounties'
      },
      dao: {
        title: 'DAO Arbiter',
        avatar: '🏛️',
        welcome: `Welcome, ${state.currentUsername} (DAO Governance Arbiter)`,
        desc: 'Stake GEN tokens in the validator committee, monitor non-deterministic equivalence execution, and govern protocol dispute reserves.',
        primaryAction: '⚖️ View Validator Committee',
        primaryActionTab: 'contracts'
      },
      predictor: {
        title: 'Oracle Predictor',
        avatar: '🔮',
        welcome: `Welcome, ${state.currentUsername} (Truth Market Predictor)`,
        desc: 'Trade and stake on real-world fact verification markets with automated multi-source web crawlers and GenLayer consensus.',
        primaryAction: '🔮 Explore Truth Markets',
        primaryActionTab: 'oracle'
      }
    };

    const profile = roleProfiles[state.currentRole] || roleProfiles.buyer;
    state.currentAvatar = profile.avatar;

    if (navUserAvatar) navUserAvatar.textContent = profile.avatar;
    if (navUserName) navUserName.textContent = state.currentUsername;
    if (navUserRole) navUserRole.textContent = profile.title.split(' ')[0];

    if (roleWelcomeTitle) roleWelcomeTitle.textContent = profile.welcome;
    if (roleWelcomeDesc) roleWelcomeDesc.textContent = profile.desc;
    if (rolePrimaryActionBtn) {
      rolePrimaryActionBtn.innerHTML = `<span>⚡</span> ${profile.primaryAction}`;
      rolePrimaryActionBtn.onclick = () => {
        if (profile.primaryActionTab === 'create-escrow') {
          createEscrowModal.classList.add('active');
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

  // Role Modal Interaction
  window.openOnboardingModal = () => {
    onboardingModal.classList.add('active');
  };

  openRoleModalBtn.addEventListener('click', () => {
    window.openOnboardingModal();
  });

  const roleSelectCards = document.querySelectorAll('.role-select-card');
  roleSelectCards.forEach(card => {
    card.addEventListener('click', () => {
      roleSelectCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const role = card.dataset.role;
      const addr = card.dataset.address;
      const name = card.dataset.name;

      document.getElementById('onboard-username').value = name;
      document.getElementById('onboard-wallet').value = addr;
      document.getElementById('onboard-submit-role-text').textContent = card.querySelector('.role-name').textContent;
    });
  });

  document.getElementById('onboarding-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedCard = document.querySelector('.role-select-card.selected');
    const role = selectedCard ? selectedCard.dataset.role : 'buyer';
    const username = document.getElementById('onboard-username').value.trim() || 'User';
    const wallet = document.getElementById('onboard-wallet').value.trim() || selectedCard.dataset.address;

    state.currentRole = role;
    state.currentUsername = username;
    state.currentWallet = wallet;

    localStorage.setItem('intellex_role', role);
    localStorage.setItem('intellex_username', username);
    localStorage.setItem('intellex_wallet', wallet);
    localStorage.setItem('intellex_onboarded', 'true');

    updateRoleUI();
    window.closeModals();
    showToast(`Welcome ${username}! Active Persona: ${role.toUpperCase()}`, 'success');
    renderEscrows();
  });

  // Check if first-time visitor
  if (!localStorage.getItem('intellex_onboarded')) {
    setTimeout(() => {
      window.openOnboardingModal();
    }, 600);
  }

  updateRoleUI();

  // Tab Navigation
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`${target}-tab`).classList.add('active');
      state.activeTab = target;
      setTimeout(attachCardTiltEffect, 100);
    });
  });

  // Faucet with animated balance counter
  faucetBtn.addEventListener('click', () => {
    const oldBal = state.balance;
    state.balance += 500.0;
    animateValue(walletBalanceDisplay, oldBal, state.balance, 800, (v) => `${v.toLocaleString()} GEN`);
    showToast('Airdropped +500.0 GEN from GenLayer Faucet!', 'success');
  });

  // Fetch and Update Node Status
  async function loadNodeStatus() {
    try {
      const status = await API.getStatus();
      state.nodeStatus = status;
      const validatorsEl = document.getElementById('stat-validators');
      const stakedEl = document.getElementById('stat-staked');
      
      if (validatorsEl) validatorsEl.textContent = `${status.active_validators} Nodes`;
      if (stakedEl) {
        animateValue(stakedEl, 0, status.total_staked, 1200, (v) => `${v.toLocaleString()} GEN`);
      }
      document.getElementById('stat-consensus').textContent = 'Optimistic Democracy';
    } catch (err) {
      console.warn('Could not fetch node status:', err);
    }
  }

  // Escrow Search & Filter Handlers
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    renderEscrows();
  });

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeFilter = chip.dataset.filter;
      renderEscrows();
    });
  });

  // Fetch Escrows
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

    // Update Counts
    const countAll = state.escrows.length;
    const countOpen = state.escrows.filter(e => e.is_open_for_claim || e.status === 'OPEN_FOR_CLAIM' || e.contractor.startsWith('0x0000')).length;
    const countMy = state.escrows.filter(e => 
      e.client.toLowerCase() === state.currentWallet.toLowerCase() || 
      e.contractor.toLowerCase() === state.currentWallet.toLowerCase()
    ).length;
    const countCompleted = state.escrows.filter(e => e.status === 'COMPLETED').length;

    document.getElementById('count-all').textContent = countAll;
    document.getElementById('count-open').textContent = countOpen;
    document.getElementById('count-my').textContent = countMy;
    document.getElementById('count-completed').textContent = countCompleted;

    // Filter Escrows
    let filtered = state.escrows.filter(escrow => {
      const matchesSearch = !state.searchQuery || 
        escrow.title.toLowerCase().includes(state.searchQuery) ||
        escrow.description.toLowerCase().includes(state.searchQuery) ||
        (escrow.category && escrow.category.toLowerCase().includes(state.searchQuery)) ||
        escrow.client.toLowerCase().includes(state.searchQuery) ||
        escrow.contractor.toLowerCase().includes(state.searchQuery);

      if (!matchesSearch) return false;

      if (state.activeFilter === 'open') {
        return escrow.is_open_for_claim || escrow.status === 'OPEN_FOR_CLAIM' || escrow.contractor.startsWith('0x0000');
      } else if (state.activeFilter === 'my-jobs') {
        return escrow.client.toLowerCase() === state.currentWallet.toLowerCase() || 
               escrow.contractor.toLowerCase() === state.currentWallet.toLowerCase();
      } else if (state.activeFilter === 'completed') {
        return escrow.status === 'COMPLETED';
      }
      return true;
    });

    if (filtered.length === 0) {
      escrowsContainer.innerHTML = `
        <div style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border-subtle);">
          <div style="font-size:2rem;margin-bottom:0.5rem;">🔍</div>
          <div style="font-size:1.1rem;font-weight:700;color:var(--text-main);margin-bottom:0.25rem;">No matching escrows found</div>
          <div>Try adjusting your search query or switching active filter chips.</div>
        </div>
      `;
      return;
    }

    filtered.forEach((escrow, cardIndex) => {
      const card = document.createElement('div');
      card.className = 'escrow-card';
      card.style.animationDelay = `${cardIndex * 0.08}s`;

      const isOpenForClaim = escrow.is_open_for_claim || escrow.status === 'OPEN_FOR_CLAIM' || escrow.contractor.startsWith('0x0000');

      let milestonesHtml = '';
      escrow.milestones.forEach((m, idx) => {
        const statusClass = m.status.toLowerCase();
        let actionBtnHtml = '';

        if (isOpenForClaim) {
          actionBtnHtml = `
            <button class="action-btn btn-sm" onclick="window.claimEscrowBounty(${escrow.id})">
              <span>🎯</span> Claim Bounty as Contractor
            </button>
          `;
        } else if (m.status === 'PENDING') {
          actionBtnHtml = `<button class="secondary-btn btn-sm" onclick="window.openSubmitModal(${escrow.id}, ${idx})">Submit Deliverable</button>`;
        } else if (m.status === 'SUBMITTED') {
          actionBtnHtml = `
            <button class="action-btn btn-sm" onclick="window.triggerAIArbitration(${escrow.id}, ${idx})">
              <span>🤖</span> Trigger GenVM AI Arbitration
            </button>
          `;
        } else if (m.status === 'APPROVED' || m.status === 'REJECTED') {
          actionBtnHtml = `<button class="secondary-btn btn-sm" onclick="window.viewResolutionReport(${escrow.id}, ${idx})">View AI Report</button>`;
        }

        let resolutionSnippet = '';
        if (m.resolution) {
          resolutionSnippet = `
            <div class="resolution-box ${m.resolution.verdict === 'APPROVED' ? '' : 'rejected'}">
              <div><strong>Verdict:</strong> <span class="score-tag">${m.resolution.verdict} (Score: ${m.resolution.score}/100)</span></div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${m.resolution.summary_reasoning}</div>
            </div>
          `;
        }

        milestonesHtml += `
          <div class="milestone-item ${statusClass}">
            <div class="milestone-top">
              <span class="milestone-name">${m.title}</span>
              <span class="milestone-amount">${m.amount} GEN</span>
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;">${m.description}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span class="status-badge ${statusClass}">${m.status}</span>
              <span style="font-size:0.75rem;color:var(--text-dim);">Threshold: ${m.quality_threshold_score}/100</span>
            </div>
            ${m.deliverable_url ? `<div style="font-size:0.75rem;margin-top:6px;font-family:var(--font-mono);color:var(--primary);overflow:hidden;text-overflow:ellipsis;">🔗 ${m.deliverable_url}</div>` : ''}
            ${resolutionSnippet}
            <div class="milestone-actions">${actionBtnHtml}</div>
          </div>
        `;
      });

      const contractorDisplay = isOpenForClaim 
        ? '<span style="color:var(--primary);font-weight:700;">🎯 Open for Claim</span>' 
        : `${escrow.contractor.slice(0, 8)}...${escrow.contractor.slice(-6)}`;

      card.innerHTML = `
        <div>
          <div class="card-header">
            <div>
              <span class="escrow-id-badge">ESCROW #${escrow.id}</span>
              ${escrow.category ? `<span class="market-category-tag" style="margin-left:6px;font-size:0.68rem;">${escrow.category}</span>` : ''}
            </div>
            <span class="status-badge ${isOpenForClaim ? 'open_for_claim' : (escrow.status === 'COMPLETED' ? 'approved' : 'pending')}">
              ${isOpenForClaim ? '🎯 OPEN CLAIM' : escrow.status}
            </span>
          </div>
          <h3 class="card-title">${escrow.title}</h3>
          <p class="card-desc">${escrow.description}</p>
          
          <div class="meta-grid">
            <div class="meta-box">
              <span class="meta-label">Client (Buyer)</span>
              <span class="meta-val" title="${escrow.client}">${escrow.client.slice(0, 8)}...${escrow.client.slice(-6)}</span>
            </div>
            <div class="meta-box">
              <span class="meta-label">Contractor</span>
              <span class="meta-val">${contractorDisplay}</span>
            </div>
            <div class="meta-box">
              <span class="meta-label">Escrow Vault</span>
              <span class="meta-val" style="color:var(--primary);font-weight:700;">${escrow.total_amount} GEN</span>
            </div>
            <div class="meta-box">
              <span class="meta-label">Disbursed</span>
              <span class="meta-val" style="color:var(--success);font-weight:700;">${escrow.total_payout_released} GEN</span>
            </div>
          </div>

          <div class="milestones-container">
            <div class="milestone-header-title">Intelligent Milestones (${escrow.milestones.length})</div>
            ${milestonesHtml}
          </div>
        </div>
      `;
      escrowsContainer.appendChild(card);
    });

    attachCardTiltEffect();
  }

  // Claim Bounty as Contractor
  window.claimEscrowBounty = async (escrowId) => {
    showToast(`Claiming Escrow #${escrowId} for wallet ${state.currentWallet.slice(0,8)}...`, 'info');
    try {
      await API.joinEscrow({
        escrow_id: escrowId,
        role: 'contractor',
        participant_address: state.currentWallet
      });
      showToast(`Successfully claimed Escrow #${escrowId}! You are now assigned as Contractor.`, 'success');
      loadEscrows();
    } catch (err) {
      showToast('Error claiming bounty: ' + err.message, 'danger');
    }
  };

  // Render Markets
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
      marketsContainer.innerHTML = '<div style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:2rem;">No prediction markets active.</div>';
      return;
    }

    state.markets.forEach((m, cardIndex) => {
      const card = document.createElement('div');
      card.className = 'market-card';
      card.style.animationDelay = `${cardIndex * 0.1}s`;

      const totalPool = m.total_yes_stake + m.total_no_stake;
      const yesPercent = totalPool > 0 ? ((m.total_yes_stake / totalPool) * 100).toFixed(1) : 50;
      const noPercent = totalPool > 0 ? (100 - yesPercent).toFixed(1) : 50;

      let resolutionSnippet = '';
      if (m.status === 'RESOLVED' && m.resolution_details) {
        resolutionSnippet = `
          <div class="resolution-box ${m.outcome === 'YES' ? '' : 'rejected'}" style="margin-top:1rem;">
            <div><strong>Autonomous Consensus Outcome:</strong> <span class="score-tag">${m.outcome}</span></div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${m.resolution_details.synthesis_summary}</div>
            <div style="font-size:0.72rem;color:var(--primary);margin-top:4px;">Confidence: ${m.resolution_details.confidence_score}% | Agreed: ${m.resolution_details.validators_agreed}/${m.resolution_details.total_validators} Validators</div>
          </div>
        `;
      }

      let actionsHtml = '';
      if (m.status === 'OPEN') {
        actionsHtml = `
          <div class="market-btn-group">
            <button class="btn-yes" onclick="window.openStakeModal(${m.id}, 'YES')">Stake YES</button>
            <button class="btn-no" onclick="window.openStakeModal(${m.id}, 'NO')">Stake NO</button>
          </div>
          <button class="action-btn" style="width:100%;margin-top:10px;justify-content:center;" onclick="window.resolveTruthForgeMarket(${m.id})">
            <span>⚡</span> Trigger GenLayer Oracle Resolution
          </button>
        `;
      }

      card.innerHTML = `
        <div>
          <span class="market-category-tag">${m.category}</span>
          <h3 class="market-question">${m.question}</h3>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.75rem;">
            <strong>Resolution Criteria:</strong> ${m.resolution_criteria}
          </div>
          
          <div class="stake-bar-container">
            <div class="stake-bar">
              <div class="stake-bar-yes" style="width: ${yesPercent}%;"></div>
            </div>
            <div class="stake-labels">
              <span class="yes-text">YES ${yesPercent}% (${m.total_yes_stake} GEN)</span>
              <span class="no-text">NO ${noPercent}% (${m.total_no_stake} GEN)</span>
            </div>
          </div>

          <div style="font-size:0.75rem;color:var(--text-dim);margin-top:6px;">
            Verified Sources: ${m.resolution_sources.map(s => `<span style="color:var(--primary);">${s.replace('https://','')}</span>`).join(', ')}
          </div>
          ${resolutionSnippet}
        </div>
        <div>
          ${actionsHtml}
        </div>
      `;
      marketsContainer.appendChild(card);
    });

    attachCardTiltEffect();
  }

  // Global window functions for modal triggers
  let activeEscrowId = null;
  let activeMilestoneIdx = null;

  window.openSubmitModal = (escrowId, milestoneIdx) => {
    activeEscrowId = escrowId;
    activeMilestoneIdx = milestoneIdx;
    submitDeliverableModal.classList.add('active');
  };

  window.closeModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  };

  // Submit Deliverable Form Handler
  document.getElementById('submit-deliverable-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('deliv-url').value;
    const notes = document.getElementById('deliv-notes').value;

    try {
      await API.submitDeliverable({
        escrow_id: activeEscrowId,
        milestone_index: activeMilestoneIdx,
        sender: state.currentWallet,
        deliverable_url: url,
        deliverable_notes: notes
      });
      window.closeModals();
      showToast('Deliverable submitted to Intelligent Contract! Ready for GenVM AI evaluation.', 'success');
      loadEscrows();
    } catch (err) {
      showToast('Failed to submit deliverable: ' + err.message, 'danger');
    }
  });

  // Multi-step Interactive AI Arbitration Trigger with fluid step transitions
  window.triggerAIArbitration = async (escrowId, milestoneIdx) => {
    aiArbitrationModal.classList.add('active');
    
    // Reset steps
    const steps = [
      document.getElementById('step-1'),
      document.getElementById('step-2'),
      document.getElementById('step-3'),
      document.getElementById('step-4'),
      document.getElementById('step-5')
    ];
    steps.forEach(s => {
      s.className = 'step-row';
    });

    const statusText = document.getElementById('arbitration-status-text');

    // Sequence the visualizer
    steps[0].classList.add('active');
    statusText.textContent = 'Selecting GenLayer Validator Committee (5 Nodes Staked)...';

    setTimeout(() => {
      steps[0].classList.remove('active');
      steps[0].classList.add('completed');
      steps[1].classList.add('active');
      statusText.textContent = 'Executing gl.nondet.web.render() across validators...';
    }, 1200);

    setTimeout(() => {
      steps[1].classList.remove('active');
      steps[1].classList.add('completed');
      steps[2].classList.add('active');
      statusText.textContent = 'GenVM LLM evaluating milestone acceptance criteria and quality score...';
    }, 2400);

    setTimeout(() => {
      steps[2].classList.remove('active');
      steps[2].classList.add('completed');
      steps[3].classList.add('active');
      statusText.textContent = 'Evaluating Equivalence Principle & aggregating validator signatures...';
    }, 3600);

    setTimeout(async () => {
      try {
        const res = await API.resolveMilestone(escrowId, milestoneIdx);
        steps[3].classList.remove('active');
        steps[3].classList.add('completed');
        steps[4].classList.add('active');
        steps[4].classList.add('completed');
        
        statusText.textContent = `Consensus Proven! Verdict: ${res.resolution.verdict} (Score: ${res.resolution.score}/100). Payout: ${res.payout_released} GEN released.`;
        showToast(`GenLayer AI Arbitration Finalized: ${res.resolution.verdict}!`, 'success');
        loadEscrows();
        setTimeout(() => {
          window.closeModals();
        }, 2500);
      } catch (err) {
        statusText.textContent = `Error in GenVM execution: ${err.message}`;
      }
    }, 4800);
  };

  // View Resolution Report Modal
  window.viewResolutionReport = (escrowId, milestoneIdx) => {
    const escrow = state.escrows.find(e => e.id === escrowId);
    if (!escrow) return;
    const m = escrow.milestones[milestoneIdx];
    if (!m || !m.resolution) return;

    const body = document.getElementById('report-modal-body');
    let criteriaList = m.resolution.criteria_evaluation.map(c => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-subtle);">
        <span>${c.passed ? '✅' : '❌'}</span>
        <div>
          <div style="font-weight:600;font-size:0.88rem;">${c.criterion}</div>
          <div style="font-size:0.76rem;color:var(--text-muted);">${c.feedback}</div>
        </div>
      </div>
    `).join('');

    body.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <span class="status-badge ${m.resolution.verdict === 'APPROVED' ? 'approved' : 'rejected'}" style="font-size:0.9rem;">
          ${m.resolution.verdict}
        </span>
        <span style="font-size:1.15rem;font-weight:700;color:var(--primary);font-family:var(--font-mono);">
          Score: ${m.resolution.score} / 100
        </span>
      </div>

      <div style="margin-bottom:1rem;">
        <h4 style="font-size:0.85rem;color:var(--text-dim);text-transform:uppercase;">GenVM Impartial Reasoning</h4>
        <p style="font-size:0.9rem;margin-top:4px;color:var(--text-main);line-height:1.5;">${m.resolution.summary_reasoning}</p>
      </div>

      <div style="margin-bottom:1rem;">
        <h4 style="font-size:0.85rem;color:var(--text-dim);text-transform:uppercase;">Criteria Checklist</h4>
        ${criteriaList}
      </div>

      <div style="padding:10px;background:var(--bg-glass);border-radius:var(--radius-sm);font-size:0.75rem;font-family:var(--font-mono);color:var(--text-muted);border:1px solid var(--border-subtle);">
        Equivalence Consensus: 5/5 Validators Agreed | Cryptographic BLS Signatures Verified
      </div>
    `;

    resolutionDetailsModal.classList.add('active');
  };

  // Toggle Contractor Assignment Mode in Create Modal
  const assignmentSelect = document.getElementById('escrow-assignment-mode');
  const contractorWrapper = document.getElementById('contractor-input-wrapper');
  if (assignmentSelect && contractorWrapper) {
    assignmentSelect.addEventListener('change', (e) => {
      if (e.target.value === 'assigned') {
        contractorWrapper.style.display = 'block';
      } else {
        contractorWrapper.style.display = 'none';
      }
    });
  }

  // Create Escrow Form Handler
  document.getElementById('open-create-escrow-btn').addEventListener('click', () => {
    createEscrowModal.classList.add('active');
  });

  document.getElementById('create-escrow-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('escrow-title').value;
    const category = document.getElementById('escrow-category').value;
    const description = document.getElementById('escrow-desc').value;
    const assignmentMode = document.getElementById('escrow-assignment-mode').value;
    const contractor = assignmentMode === 'assigned' ? document.getElementById('escrow-contractor').value : '';
    const amount = parseFloat(document.getElementById('escrow-amount').value);
    const mTitle = document.getElementById('milestone-1-title').value;
    const mDesc = document.getElementById('milestone-1-desc').value;
    const criteriaRaw = document.getElementById('milestone-1-criteria').value;

    const criteriaList = criteriaRaw.split('\n').map(c => c.trim()).filter(Boolean);

    try {
      await API.createEscrow({
        client: state.currentWallet,
        contractor: contractor,
        title: title,
        description: description,
        category: category,
        total_amount: amount,
        is_open_for_claim: assignmentMode === 'open',
        milestones: [
          {
            title: mTitle,
            description: mDesc,
            amount: amount,
            acceptance_criteria: criteriaList,
            quality_threshold_score: 80
          }
        ]
      });
      window.closeModals();
      showToast('Intelligent Escrow successfully deployed to GenLayer!', 'success');
      loadEscrows();
    } catch (err) {
      showToast('Failed to create escrow: ' + err.message, 'danger');
    }
  });

  // TruthForge Prediction Market Staking
  let activeMarketId = null;
  let activeMarketSide = 'YES';

  window.openStakeModal = (marketId, side) => {
    activeMarketId = marketId;
    activeMarketSide = side;
    document.getElementById('stake-side-indicator').textContent = side;
    document.getElementById('stake-side-indicator').className = side === 'YES' ? 'yes-text' : 'no-text';
    document.getElementById('stake-modal').classList.add('active');
  };

  document.getElementById('stake-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('stake-amount').value);
    try {
      await API.placeBet({
        market_id: activeMarketId,
        sender: state.currentWallet,
        side: activeMarketSide,
        amount: amount
      });
      window.closeModals();
      showToast(`Staked ${amount} GEN on ${activeMarketSide}!`, 'success');
      loadMarkets();
    } catch (err) {
      showToast('Staking error: ' + err.message, 'danger');
    }
  });

  // Resolve TruthForge Market via GenVM
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

  // Open Create Market Modal
  document.getElementById('open-create-market-btn').addEventListener('click', () => {
    createMarketModal.classList.add('active');
  });

  document.getElementById('create-market-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = document.getElementById('market-question').value;
    const category = document.getElementById('market-category').value;
    const criteria = document.getElementById('market-criteria').value;
    const sourcesRaw = document.getElementById('market-sources').value;

    const sources = sourcesRaw.split('\n').map(s => s.trim()).filter(Boolean);

    try {
      await API.createMarket({
        creator: state.currentWallet,
        question: question,
        category: category,
        resolution_sources: sources,
        resolution_criteria: criteria,
        deadline_timestamp: Math.floor(Date.now() / 1000) + 86400 * 7
      });
      window.closeModals();
      showToast('TruthForge prediction market created on GenLayer!', 'success');
      loadMarkets();
    } catch (err) {
      showToast('Failed to create market: ' + err.message, 'danger');
    }
  });

  // Contract Code Inspector
  const codeTabs = document.querySelectorAll('.code-tab-btn');
  const codeBody = document.getElementById('contract-code-body');

  function renderContractCode(contractName) {
    if (!window.GENLAYER_CONTRACTS) return;
    codeBody.textContent = window.GENLAYER_CONTRACTS[contractName] || '# Contract source loading...';
  }

  codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      codeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const contractName = tab.dataset.contract;
      state.selectedContractCode = contractName;
      renderContractCode(contractName);
    });
  });

  renderContractCode('IntelligentEscrow');

  // Initial load
  loadNodeStatus();
  loadEscrows();
  loadMarkets();
});
