# 🛡️ GenLayer Intellex Protocol & AI Oracle Platform

**Intellex** is a flagship decentralized dApp and autonomous resolution platform built natively on **GenLayer**. It leverages **GenLayer Intelligent Contracts** to execute complex, subjective, non-deterministic logic — combining on-chain LLM reasoning (`gl.nondet.exec_prompt`), real-time web scraping (`gl.nondet.web.render`), and validator consensus (`gl.eq_principle.prompt_non_comparative` / `gl.eq_principle.strict_eq`).

---

## 🚀 Key Features

1. **Intelligent Milestone Escrow (`IntelligentEscrow.py`)**
   - Autonomous milestone verification without human arbitrators.
   - Contractors submit deliverables (GitHub repository PRs, deployed URLs, Figma links, audit reports).
   - GenVM executes multi-validator LLM reasoning against strict acceptance criteria and minimum quality threshold scores (0-100).
   - If approved by validator consensus, funds are released immediately to the contractor wallet.

2. **TruthForge Autonomous Prediction & Fact Oracle (`TruthForgeOracle.py`)**
   - Trustless prediction markets and real-world claim verification.
   - Crawls multi-source authoritative web references in real-time.
   - Employs GenLayer Optimistic Democracy to establish verifiable objective ground truth on-chain.

3. **GenVM Live Runtime Simulator (`genlayer_runtime.py`)**
   - 5 Staked committee validator nodes (`alpha`, `beta`, `gamma`, `delta`, `omega`).
   - Implements non-deterministic execution sandbox and BLS signature aggregation.

4. **Modern Glassmorphic Web3 Frontend**
   - High-fidelity dark cyber interface with neon accents, custom design tokens, and smooth CSS micro-animations.
   - Simulated wallet switcher (Alice, Bob, Devin, Elena) + 1-Click GEN faucet.
   - Real-time step-by-step GenVM AI Arbitration visualizer modal.
   - In-browser Python Intelligent Contracts inspector.

---

## 📁 Repository Structure

```
genlayer-intellex-platform/
├── contracts/
│   ├── IntelligentEscrow.py       # GenLayer Intelligent Contract for AI-governed escrows
│   ├── TruthForgeOracle.py        # GenLayer Intelligent Contract for prediction & fact oracles
│   └── genlayer_runtime.py        # GenVM runtime simulator with Equivalence Principle
├── server/
│   └── main.py                    # FastAPI server exposing REST endpoints & static frontend
├── frontend/
│   ├── index.html                 # Main Web3 dApp HTML layout
│   ├── css/
│   │   └── style.css              # Glassmorphic cyber design system
│   └── js/
│       ├── api.js                 # API client bridge
│       ├── app.js                 # dApp controller & animation visualizer
│       └── contracts_code.js      # Python contracts code inspector
├── tests/
│   └── test_contracts.py          # Comprehensive test suite for GenLayer contracts
└── README.md
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- Python 3.10+ (Running on Python 3.14)
- FastAPI & Uvicorn

### 2. Running Contract Tests
```bash
.venv/bin/python tests/test_contracts.py
```

### 3. Running the Server & Frontend
```bash
.venv/bin/uvicorn server.main:app --host 0.0.0.0 --port 8000
```
Open your browser at **`http://localhost:8000`** to interact with the full dApp.

---

## ⚡ GenLayer Intelligent Contract Snippet

```python
# { "Depends": "py-genlayer:0.1.0" }
from genlayer import *

class IntelligentEscrow(gl.Contract):
    @gl.public.write
    def resolve_milestone(self, escrow_id: int, milestone_idx: int) -> dict:
        m = self.escrows[escrow_id]["milestones"][milestone_idx]

        # Non-Deterministic evaluation
        def nondet_eval():
            web_data = gl.nondet.web.render(m["deliverable_url"])
            prompt = f"Milestone: {m['title']}\\nCriteria: {m['acceptance_criteria']}\\nDeliverable: {web_data}"
            return gl.nondet.exec_prompt(prompt)

        # Equivalence Principle consensus across validator committee
        result = gl.eq_principle.prompt_non_comparative(
            nondet_eval,
            criteria="Verify code quality, security, and criteria compliance."
        )

        if result.get("verdict") == "APPROVED":
            m["status"] = "APPROVED"
            gl.message.transfer(self.escrows[escrow_id]["contractor"], m["amount"])
            
        return result
```
