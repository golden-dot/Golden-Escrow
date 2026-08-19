/**
 * api.js - GenLayer Intellex Protocol API Client & On-Chain State Interface
 * Network: GenLayer Bradbury
 * Single Source of Truth: GenLayer Intelligent Contract
 */

const DEPLOYED_ESCROW_CONTRACT = "0xc40d279E9f8a48AEE0c6383A23Bf3431d0B620Ec";
const DEPLOYED_ORACLE_CONTRACT = "0x503402BF6Ccadf366D269FE397B79c2CFfF011AC";

// BroadcastChannel for real-time cross-tab synchronization
let broadcastChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel('intellex_global_sync');
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'ESCROWS_UPDATED') {
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('intellex:escrows_updated', { detail: event.data.escrows }));
        }
      }
    };
  }
} catch (e) {}

class APIClient {
  constructor() {
    this.baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:8000' : '';
  }

  async getStatus() {
    try {
      const res = await fetch(`${this.baseUrl}/api/status`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      network: "GenLayer Bradbury",
      protocol_version: "v0.3.0-remediated",
      deployed_escrow_contract: DEPLOYED_ESCROW_CONTRACT,
      deployed_oracle_contract: DEPLOYED_ORACLE_CONTRACT,
      escrow_studio_url: `https://studio.genlayer.com/contract/${DEPLOYED_ESCROW_CONTRACT}`,
      oracle_studio_url: `https://studio.genlayer.com/contract/${DEPLOYED_ORACLE_CONTRACT}`,
      active_validators: 5,
      total_staked: 194000
    };
  }

  async getEscrows() {
    try {
      const res = await fetch(`${this.baseUrl}/api/escrows`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (broadcastChannel) {
            try { broadcastChannel.postMessage({ type: 'ESCROWS_UPDATED', escrows: data }); } catch (e) {}
          }
          return data;
        }
      }
    } catch (e) {}
    return [];
  }

  // Create Escrow Bounty Vault on Contract
  async createEscrow(data) {
    const res = await fetch(`${this.baseUrl}/api/escrows/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_address: data.client || "0x0000000000000000000000000000000000000000",
        contractor_address: data.contractor || "0x0000000000000000000000000000000000000000",
        title: data.title,
        description: data.description || "",
        category: data.category || "SDK & Developer Tooling",
        requirements: data.requirements,
        criteria: data.criteria,
        amount: data.amount,
        quality_threshold: data.quality_threshold || 80
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Contract creation failed");
    }
    return await res.json();
  }

  // Confirm Deposit Payment & Fund Escrow on Contract
  async confirmEscrowDeposit(escrowId, depositAmount, clientAddress) {
    const res = await fetch(`${this.baseUrl}/api/escrows/${escrowId}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_address: clientAddress || "0x0000000000000000000000000000000000000000",
        deposit_amount: depositAmount
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Deposit confirmation failed");
    }
    return await res.json();
  }

  // Claim Open Bounty as Contractor
  async joinEscrow(data) {
    const res = await fetch(`${this.baseUrl}/api/escrows/${data.escrow_id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractor_address: data.participant_address || "0x0000000000000000000000000000000000000000"
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Claim task failed");
    }
    return await res.json();
  }

  // Submit Deliverable for AI Arbitration
  async submitDeliverable(data) {
    const res = await fetch(`${this.baseUrl}/api/escrows/${data.escrow_id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractor_address: data.sender || "0x0000000000000000000000000000000000000000",
        deliverable_url: data.deliverable_url,
        deliverable_notes: data.deliverable_notes
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Deliverable submission failed");
    }
    return await res.json();
  }

  // Trigger AI Arbitration & Independent Validator Consensus
  async resolveMilestone(escrowId) {
    const res = await fetch(`${this.baseUrl}/api/escrows/${escrowId}/arbitrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Arbitration execution failed");
    }
    const data = await res.json();
    return {
      success: true,
      decision: data.escrow ? data.escrow.decision : "REJECT",
      is_approved: data.status === "PAYOUT_CLAIMABLE" || data.status === "APPROVED",
      status: data.status,
      escrow: data.escrow
    };
  }

  // Release Payout to Contractor Address
  async releasePayout(escrowId, callerAddress, destinationAddress) {
    const res = await fetch(`${this.baseUrl}/api/escrows/${escrowId}/payout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caller_address: callerAddress || "0x0000000000000000000000000000000000000000",
        destination_address: destinationAddress
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Payout release failed");
    }
    return await res.json();
  }

  // Claim Refund for Unclaimed/Rejected/Expired Escrow
  async claimRefund(escrowId, clientAddress) {
    const res = await fetch(`${this.baseUrl}/api/escrows/${escrowId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_address: clientAddress
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Refund request failed");
    }
    return await res.json();
  }

  // Appeal Rejected Verdict
  async appealRejection(escrowId, contractorAddress, newUrl, newNotes) {
    const res = await fetch(`${this.baseUrl}/api/escrows/${escrowId}/appeal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractor_address: contractorAddress,
        new_deliverable_url: newUrl,
        new_deliverable_notes: newNotes
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Appeal submission failed");
    }
    return await res.json();
  }

  async getMarkets() {
    try {
      const res = await fetch(`${this.baseUrl}/api/markets`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [];
  }
}

window.API = new APIClient();
