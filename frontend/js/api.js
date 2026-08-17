/**
 * api.js - REST API Client for GenLayer Intellex Protocol
 */

const API_BASE = window.location.origin.includes('8000') 
  ? '' 
  : 'http://localhost:8000';

const API = {
  async getStatus() {
    const res = await fetch(`${API_BASE}/api/status`);
    return await res.json();
  },

  async getEscrows() {
    const res = await fetch(`${API_BASE}/api/escrows`);
    return await res.json();
  },

  async getEscrow(id) {
    const res = await fetch(`${API_BASE}/api/escrows/${id}`);
    return await res.json();
  },

  async createEscrow(data) {
    const res = await fetch(`${API_BASE}/api/escrows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async joinEscrow(data) {
    const res = await fetch(`${API_BASE}/api/escrows/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async submitDeliverable(data) {
    const res = await fetch(`${API_BASE}/api/escrows/submit-deliverable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async resolveMilestone(escrowId, milestoneIndex) {
    const res = await fetch(`${API_BASE}/api/escrows/resolve-milestone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escrow_id: escrowId, milestone_index: milestoneIndex })
    });
    return await res.json();
  },

  async getMarkets() {
    const res = await fetch(`${API_BASE}/api/markets`);
    return await res.json();
  },

  async createMarket(data) {
    const res = await fetch(`${API_BASE}/api/markets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async placeBet(data) {
    const res = await fetch(`${API_BASE}/api/markets/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async resolveMarket(marketId) {
    const res = await fetch(`${API_BASE}/api/markets/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market_id: marketId })
    });
    return await res.json();
  }
};
