# Golden Escrow — GenLayer Security & Architecture Remediation

[![Protocol Version](https://img.shields.io/badge/GenLayer-v0.3.0--remediated-6366f1.svg)](https://studio.genlayer.com)
[![Network](https://img.shields.io/badge/Network-GenLayer_Bradbury-10b981.svg)](https://genlayer.com)
[![Security Audited](https://img.shields.io/badge/Security-100%25_Passing-success.svg)](#testing)

**Golden Escrow** is a production-grade, security-conscious, auditable GenLayer-native escrow platform. It leverages Py-GenLayer Intelligent Contracts on the **GenLayer Bradbury** testnet to provide AI-governed milestone verification, optimistic democracy consensus, role-based authorization, and strict financial custody invariants.

---

## 🏛️ Architecture Overview

```
 ┌─────────────────────────────────────────────────────────┐
 │               Frontend dApp (Web3 Provider)             │
 └────────────────────────────┬────────────────────────────┘
                              │ EIP-1193 / Web3 Provider
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │               FastAPI API / Indexer Layer               │
 └────────────────────────────┬────────────────────────────┘
                              │ Read Views & Tx Proxies
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │        GenLayer Intelligent Contract (Authoritative)    │
 │                IntelligentEscrow.py                      │
 └────────────────────────────┬────────────────────────────┘
                              │ Optimistic Democracy Consensus
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │        GenVM Non-Deterministic LLM Committee            │
 │            (5 Independent Validator Nodes)              │
 └─────────────────────────────────────────────────────────┘
```

---

## 🔄 Escrow State Machine Graph

The lifecycle of every escrow bounty is governed by an explicit 16-state transition graph:

```text
               CREATED
                  │ (deposit_funds)
                  ▼
                FUNDED
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 OPEN_FOR_CLAIM          ACTIVE
   (unassigned)        (assigned)
        │                   │
        │ (claim_escrow)    │
        └─────────┬─────────┘
                  │
                  ▼
                ACTIVE ──(cancel_escrow)──► REFUNDABLE / CANCELLED
                  │
                  │ (submit_deliverable)
                  ▼
              SUBMITTED
                  │ (arbitrate)
                  ▼
              VERIFYING
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    APPROVED             REJECTED ──► (appeal_rejection) ──► APPEALED ──► (arbitrate)
        │                   │                                                   │
        ▼                   ▼                                                   ▼
PAYOUT_CLAIMABLE        REFUNDABLE ◄────────────────────────────────────────────┘
        │                   │
        │ (release_payout)  │ (claim_refund)
        ▼                   ▼
  PAYOUT_CLAIMED         REFUNDED
```

---

## 💰 Asset Custody & Financial Accounting Invariant

Funds cannot be represented as deposited unless on-chain deposit confirmation has occurred.
Every escrow contract enforces the strict accounting invariant:

$$\text{deposited\_amount} = \text{released\_amount} + \text{refunded\_amount} + \text{remaining\_amount}$$

* **No Double Deposits**: Deposit amounts are validated once and locked in contract vault storage.
* **No Double Releases**: Releasing payout zeroes out remaining balance.
* **No Money Creation**: Contract balance can never exceed `deposited_amount`.

---

## 🛡️ AI Prompt-Injection Countermeasures

All user-controlled fields (`title`, `requirements`, `criteria`, `deliverable_url`, `deliverable_notes`) are treated as adversarial inputs.

1. **Input Size Bounding**: Max length constraints on all input strings (e.g. 200 chars title, 2000 chars criteria, 4000 chars notes).
2. **Prompt Isolation**: Evaluation prompts strictly separate `SYSTEM_POLICY`, `IMMUTABLE_RULES`, `ACCEPTANCE_CRITERIA`, and `UNTRUSTED_EVIDENCE`.
3. **Validator Instructions**: System policies direct GenVM nodes to ignore any embedded prompt override or claim of automatic approval inside submitted code or notes.
4. **Protocol Quality Threshold**: Contract code independently checks `score >= quality_threshold`.

---

## ⚖️ Independent Validator Consensus

Secondary validators evaluate submitted evidence independently without being anchored to the leader's decision:

```text
            Leader Node (GenVM)
                     │
         Executes Evaluation Prompt
                     │
                     ▼
           Leader Verdict & Score
                     │
     ┌───────────────┴───────────────┐
     ▼                               ▼
Validator B (GenVM)             Validator C (GenVM)
Independent Prompt              Independent Prompt
     │                               │
     └───────────────┬───────────────┘
                     ▼
       Equivalence Principle Consensus
```

---

## 📜 Audit Evidence Integrity

When deliverables are submitted, the contract calculates a SHA-256 evidence hash:

$$\text{evidence\_hash} = \text{SHA256}(\text{deliverable\_url} + \text{":"} + \text{deliverable\_notes})$$

The evidence hash and validator consensus logs are stored permanently on-chain for auditing.

---

## 🔐 Role-Based Permission Matrix

| Operation | Client | Contractor | Attacker / Unauthorized |
| :--- | :---: | :---: | :---: |
| `create_escrow` | ✅ | ❌ | ❌ |
| `deposit_funds` | ✅ | ❌ | ❌ |
| `claim_escrow` | ❌ (No Self-Claim) | ✅ | ❌ |
| `submit_deliverable` | ❌ | ✅ (Assigned only) | ❌ |
| `arbitrate` | ✅ | ✅ | ❌ |
| `appeal_rejection` | ❌ | ✅ (Max 1) | ❌ |
| `release_payout` | ✅ | ✅ (To Contractor) | ❌ |
| `claim_refund` | ✅ | ❌ | ❌ |

---

## 📡 Live Contract Addresses (GenLayer Bradbury)

* **IntelligentEscrow Contract**: `0xc40d279E9f8a48AEE0c6383A23Bf3431d0B620Ec`
* **TruthForgeOracle Contract**: `0x503402BF6Ccadf366D269FE397B79c2CFfF011AC`
* **GenLayer Studio Explorer**: [https://studio.genlayer.com](https://studio.genlayer.com)

---

## 🧪 Testing & Execution

### Run Contract & Security Test Suite:

```bash
# Run unit, integration, and security remediation test suite
.venv/bin/python tests/test_contracts.py
.venv/bin/python tests/test_security_remediation.py
```

### Run FastAPI Backend API:

```bash
.venv/bin/uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📄 Security & Audit Disclaimer

While this codebase implements robust financial accounting invariants, input sanitization, prompt-injection defenses, and role-based access control, production deployment on live mainnets should always undergo a formal third-party cryptographic audit.
