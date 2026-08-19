"""
main.py - FastAPI Application Server for GenLayer Intellex Protocol
Connects Frontend dApp with GenLayer Intelligent Contracts & GenVM Runtime.
"""
import os
import sys
import time
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Add contracts path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../contracts")))

from IntelligentEscrow import IntelligentEscrow
from TruthForgeOracle import TruthForgeOracle
from genlayer_runtime import GenLayerRuntime

app = FastAPI(
    title="GenLayer Intellex Protocol API",
    description="Autonomous AI-Governed Escrow & Truth Oracle Platform on GenLayer",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Live Deployed Contract Address on GenLayer StudioNet
DEPLOYED_ESCROW_CONTRACT = "0xd0C596531ea0653Def4AAb200a9B8A3686bed552"

# Initialize GenLayer Runtime & Intelligent Contracts
runtime = GenLayerRuntime()
escrow_contract = IntelligentEscrow()
oracle_contract = TruthForgeOracle()

def seed_demo_data():
    # 1. Escrow #1: Web3 Security Audit (Assigned to Bob)
    escrow_contract.create_escrow(
        contractor="0xBob791C2DeB8b7F498616142718E84e50882e308",
        title="GenLayer DEX Router Intelligent Contract Audit",
        description="Comprehensive security assessment, GenVM non-deterministic invariant testing, and mathematical formal verification.",
        category="Smart Contract Security",
        requirements="Develop automated fuzz tests for non-deterministic web and prompt handlers.",
        criteria="Zero reentrancy or state mismatch during validator equivalence. Fuzz suite covers > 10,000 synthetic transaction edge-cases.",
        amount=1200,
        quality_threshold=85
    )

    # 2. Escrow #2: Open Bounty (Available for Any Contractor / Freelancer to Claim!)
    escrow_contract.create_escrow(
        contractor="0x0000000000000000000000000000000000000000",  # Open for claim
        title="GenLayer Python SDK Async WebSocket Listener Bounty",
        description="Open Community Bounty: Build high-throughput async WebSocket event subscription wrapper for GenLayer nodes with automatic reconnects.",
        category="SDK & Developer Tooling",
        requirements="Deliver modular Python package with 90%+ pytest coverage and typing annotations.",
        criteria="Fully async using asyncio and websockets. Pytest suite passing with 90%+ code coverage.",
        amount=950,
        quality_threshold=85
    )

    # 3. Escrow #3: Studio Visual Redesign
    escrow_contract.create_escrow(
        contractor="0xDevin22FA091c01e9DbA92b8F78241e57c15291244f",
        title="GenLayer Studio Visual Redesign & 3D Assets",
        description="High-converting dark glassmorphic interface, SVG animations, and design token library.",
        category="Design & UI/UX",
        requirements="Deliver design tokens (colors, typography, micro-animations) and high-fidelity prototype in Figma.",
        criteria="Figma file includes Dark and Cyber themes. Responsive layout grids for Mobile, Tablet, and Desktop.",
        amount=800,
        quality_threshold=80
    )

    # Submit deliverable for Escrow 1
    escrow_contract.submit_deliverable(
        escrow_id=1,
        deliverable_url="https://github.com/genlayer/audit-router-deliverable",
        deliverable_notes="Completed the invariant fuzz testing suite. 15,000 iterations executed with zero equivalence breaks. Security report attached."
    )

    # Seed Oracle Markets
    oracle_contract.create_market(
        question="Will the official GenLayer Testnet v2 launch before Q4 2026?",
        category="Protocol Upgrades",
        sources="https://genlayer.com,https://docs.genlayer.com/releases",
        criteria="Resolves YES if GenLayer core team announces public testnet v2 on official channels."
    )
    oracle_contract.place_stake(1, "YES", 120)
    oracle_contract.place_stake(1, "NO", 45)

    oracle_contract.create_market(
        question="Did SpaceX Starship achieve successful payload deployment in the latest orbital test?",
        category="Aerospace & Tech",
        sources="https://spacex.com/launches,https://nasaspaceflight.com",
        criteria="Resolves YES if official telemetry confirms orbital insertion and payload release."
    )
    oracle_contract.place_stake(2, "YES", 300)
    oracle_contract.place_stake(2, "NO", 50)

seed_demo_data()

# -------------------------------------------------------------
# Pydantic Request Models
# -------------------------------------------------------------
class CreateEscrowRequest(BaseModel):
    client: Optional[str] = ""
    contractor: Optional[str] = "0x0000000000000000000000000000000000000000"
    title: str
    description: str
    category: Optional[str] = "Software Development"
    requirements: str
    criteria: str
    amount: float
    quality_threshold: Optional[int] = 80

class JoinEscrowRequest(BaseModel):
    escrow_id: int
    role: str
    participant_address: str

class SubmitDeliverableRequest(BaseModel):
    escrow_id: int
    sender: str
    deliverable_url: str
    deliverable_notes: str

class ResolveMilestoneRequest(BaseModel):
    escrow_id: int

class CreateMarketRequest(BaseModel):
    creator: str
    question: str
    category: str
    resolution_sources: List[str]
    resolution_criteria: str
    deadline_timestamp: Optional[int] = 0

class PlaceBetRequest(BaseModel):
    market_id: int
    sender: str
    side: str
    amount: float

class ResolveMarketRequest(BaseModel):
    market_id: int

# -------------------------------------------------------------
# REST Endpoints
# -------------------------------------------------------------
@app.get("/api/status")
def get_node_status():
    return {
        "network": "GenLayer StudioNet",
        "protocol_version": "v0.2.16",
        "deployed_escrow_contract": DEPLOYED_ESCROW_CONTRACT,
        "studio_url": f"https://studio.genlayer.com/contract/{DEPLOYED_ESCROW_CONTRACT}",
        "active_validators": len(runtime.validators),
        "validators": runtime.validators,
        "total_staked": sum(v["stake"] for v in runtime.validators),
        "consensus_mechanism": "Optimistic Democracy (GenVM Equivalence Principle)",
        "contracts_deployed": 2,
        "timestamp": int(time.time())
    }

@app.get("/api/escrows")
def get_all_escrows():
    return escrow_contract.get_all_escrows() if hasattr(escrow_contract, "get_all_escrows") else [
        escrow_contract.get_escrow(i) for i in range(1, int(escrow_contract.next_escrow_id))
    ]

@app.get("/api/escrows/{escrow_id}")
def get_escrow(escrow_id: int):
    try:
        return escrow_contract.get_escrow(escrow_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/escrows")
def create_escrow(req: CreateEscrowRequest):
    escrow_id = escrow_contract.create_escrow(
        contractor=req.contractor or "0x0000000000000000000000000000000000000000",
        title=req.title,
        description=req.description,
        category=req.category or "Software Development",
        requirements=req.requirements,
        criteria=req.criteria,
        amount=int(req.amount),
        quality_threshold=req.quality_threshold or 80
    )
    return {"success": True, "escrow_id": int(escrow_id), "escrow": escrow_contract.get_escrow(int(escrow_id))}

@app.post("/api/escrows/join")
def join_escrow(req: JoinEscrowRequest):
    try:
        escrow_contract.claim_escrow(req.escrow_id)
        return {"success": True, "message": "Successfully claimed escrow as Contractor!", "escrow": escrow_contract.get_escrow(req.escrow_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/escrows/submit-deliverable")
def submit_deliverable(req: SubmitDeliverableRequest):
    try:
        escrow_contract.submit_deliverable(
            escrow_id=req.escrow_id,
            deliverable_url=req.deliverable_url,
            deliverable_notes=req.deliverable_notes
        )
        return {"success": True, "message": "Deliverable submitted. Ready for GenLayer AI verification."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/escrows/resolve-milestone")
def resolve_milestone(req: ResolveMilestoneRequest):
    try:
        decision = escrow_contract.arbitrate(req.escrow_id)
        escrow = escrow_contract.get_escrow(req.escrow_id)
        return {
            "success": True,
            "decision": decision,
            "is_approved": decision == "ACCEPT",
            "payout_released": escrow["amount"] if decision == "ACCEPT" else 0,
            "resolution": {
                "verdict": "APPROVED" if decision == "ACCEPT" else "REJECTED",
                "score": escrow["score"],
                "summary_reasoning": f"GenVM Validator Committee evaluated requirements and rendered decision: {decision}.",
                "validators_agreed": 5,
                "total_validators": 5
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- TruthForge Oracle Routes ---
@app.get("/api/markets")
def get_all_markets():
    return [oracle_contract.get_market(i) for i in range(1, int(oracle_contract.next_market_id))]

@app.get("/api/markets/{market_id}")
def get_market(market_id: int):
    try:
        return oracle_contract.get_market(market_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/markets")
def create_market(req: CreateMarketRequest):
    market_id = oracle_contract.create_market(
        question=req.question,
        category=req.category,
        sources=",".join(req.resolution_sources),
        criteria=req.resolution_criteria
    )
    return {"success": True, "market_id": int(market_id), "market": oracle_contract.get_market(int(market_id))}

@app.post("/api/markets/bet")
def place_bet(req: PlaceBetRequest):
    try:
        oracle_contract.place_stake(req.market_id, req.side, int(req.amount))
        m = oracle_contract.get_market(req.market_id)
        return {"success": True, "total_yes": m["total_yes"], "total_no": m["total_no"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/markets/resolve")
def resolve_market(req: ResolveMarketRequest):
    try:
        outcome = oracle_contract.resolve_market(req.market_id)
        m = oracle_contract.get_market(req.market_id)
        return {
            "success": True,
            "outcome": outcome,
            "total_pool": m["total_yes"] + m["total_no"],
            "resolution_details": {
                "outcome": outcome,
                "confidence_score": m["confidence"],
                "synthesis_summary": f"GenVM Equivalence Validators confirmed real-world outcome '{outcome}'.",
                "validators_agreed": 5,
                "total_validators": 5
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Serve static frontend files
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
