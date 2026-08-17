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

# Initialize GenLayer Runtime & Intelligent Contracts
runtime = GenLayerRuntime()
escrow_contract = IntelligentEscrow()
oracle_contract = TruthForgeOracle()

def seed_demo_data():
    # 1. Escrow #1: Web3 Security Audit (Assigned to Bob)
    escrow_contract.create_escrow(
        client="0xAlice94A17B809F3d445492F6F16c14C2361B1cA29A33",
        contractor="0xBob791C2DeB8b7F498616142718E84e50882e308",
        title="GenLayer DEX Router Intelligent Contract Audit",
        description="Comprehensive security assessment, GenVM non-deterministic invariant testing, and mathematical formal verification.",
        category="Smart Contract Security",
        total_amount=1200.0,
        milestones=[
            {
                "title": "Phase 1: Invariant Analysis & GenVM Fuzzing",
                "description": "Develop automated fuzz tests for non-deterministic web and prompt handlers.",
                "amount": 500.0,
                "acceptance_criteria": [
                    "Zero reentrancy or state mismatch during validator equivalence",
                    "Fuzz suite covers > 10,000 synthetic transaction edge-cases",
                    "Formal report PDF and GitHub repository PR delivered"
                ],
                "quality_threshold_score": 85
            },
            {
                "title": "Phase 2: Final Remediation & Mainnet Readiness Review",
                "description": "Verify dev team patches against identified vulnerabilities.",
                "amount": 700.0,
                "acceptance_criteria": [
                    "All severity findings marked as resolved or mitigated",
                    "Signed cryptographic audit certificate"
                ],
                "quality_threshold_score": 90
            }
        ]
    )

    # 2. Escrow #2: Open Bounty (Available for Any Contractor / Freelancer to Claim!)
    escrow_contract.create_escrow(
        client="0xAlice94A17B809F3d445492F6F16c14C2361B1cA29A33",
        contractor="",  # Open for claim
        title="GenLayer Python SDK Async WebSocket Listener Bounty",
        description="Open Community Bounty: Build high-throughput async WebSocket event subscription wrapper for GenLayer nodes with automatic reconnects.",
        category="SDK & Developer Tooling",
        total_amount=950.0,
        milestones=[
            {
                "title": "Asyncio Client Implementation & Unit Test Suite",
                "description": "Deliver modular Python package with 90%+ pytest coverage and typing annotations.",
                "amount": 950.0,
                "acceptance_criteria": [
                    "Fully async using asyncio and aiohttp/websockets",
                    "Pytest suite passing with 90%+ code coverage",
                    "Includes clean README and example scripts"
                ],
                "quality_threshold_score": 85
            }
        ],
        is_open_for_claim=True
    )

    # 3. Escrow #3: Studio Visual Redesign
    escrow_contract.create_escrow(
        client="0xElena45C89D91176b91E5a46B18D64a024A211f421a7",
        contractor="0xDevin22FA091c01e9DbA92b8F78241e57c15291244f",
        title="GenLayer Studio Visual Redesign & 3D Assets",
        description="High-converting dark glassmorphic interface, SVG animations, and design token library.",
        category="Design & UI/UX",
        total_amount=800.0,
        milestones=[
            {
                "title": "Design System Tokens & Figma Wireframes",
                "description": "Deliver design tokens (colors, typography, micro-animations) and high-fidelity prototype in Figma.",
                "amount": 350.0,
                "acceptance_criteria": [
                    "Figma file includes Dark and Cyber themes",
                    "Responsive layout grids for Mobile, Tablet, and Desktop",
                    "WCAG 2.1 AA color contrast compliance"
                ],
                "quality_threshold_score": 80
            },
            {
                "title": "Interactive Frontend Component Library",
                "description": "Implement vanilla CSS & modern JS components matching Figma specifications.",
                "amount": 450.0,
                "acceptance_criteria": [
                    "Zero external bulky framework dependencies",
                    "Lighthouse performance score >= 95"
                ],
                "quality_threshold_score": 85
            }
        ]
    )

    # Submit deliverable for Escrow 1 Milestone 0
    escrow_contract.submit_deliverable(
        escrow_id=1,
        milestone_index=0,
        sender="0xBob791C2DeB8b7F498616142718E84e50882e308",
        deliverable_url="https://github.com/genlayer/audit-router-deliverable",
        deliverable_notes="Completed the invariant fuzz testing suite. 15,000 iterations executed with zero equivalence breaks. Security report attached."
    )

    # Seed Oracle Markets
    oracle_contract.create_market(
        creator="0xGenGov000100000000000000000000000000000001",
        question="Will the official GenLayer Testnet v2 launch before Q4 2026?",
        category="Protocol Upgrades",
        resolution_sources=["https://genlayer.com", "https://docs.genlayer.com/releases"],
        resolution_criteria="Resolves YES if GenLayer core team announces public testnet v2 on official channels.",
        deadline_timestamp=1778900000
    )
    oracle_contract.place_bet(1, "0xAlice94A1", "YES", 120.0)
    oracle_contract.place_bet(1, "0xBob791C", "NO", 45.0)

    oracle_contract.create_market(
        creator="0xElena45C89D91176b91E5a46B18D64a024A211f421a7",
        question="Did SpaceX Starship achieve successful payload deployment in the latest orbital test?",
        category="Aerospace & Tech",
        resolution_sources=["https://spacex.com/launches", "https://nasaspaceflight.com"],
        resolution_criteria="Resolves YES if official telemetry confirms orbital insertion and payload release.",
        deadline_timestamp=1779500000
    )
    oracle_contract.place_bet(2, "0xDevin22F", "YES", 300.0)
    oracle_contract.place_bet(2, "0xAlice94A1", "NO", 50.0)

seed_demo_data()

# -------------------------------------------------------------
# Pydantic Request Models
# -------------------------------------------------------------
class MilestoneInput(BaseModel):
    title: str
    description: str
    amount: float
    acceptance_criteria: List[str]
    quality_threshold_score: int = 75

class CreateEscrowRequest(BaseModel):
    client: str
    contractor: Optional[str] = ""
    title: str
    description: str
    category: Optional[str] = "Software Development"
    total_amount: float
    milestones: List[MilestoneInput]
    is_open_for_claim: Optional[bool] = False

class JoinEscrowRequest(BaseModel):
    escrow_id: int
    role: str
    participant_address: str

class SubmitDeliverableRequest(BaseModel):
    escrow_id: int
    milestone_index: int
    sender: str
    deliverable_url: str
    deliverable_notes: str

class ResolveMilestoneRequest(BaseModel):
    escrow_id: int
    milestone_index: int

class CreateMarketRequest(BaseModel):
    creator: str
    question: str
    category: str
    resolution_sources: List[str]
    resolution_criteria: str
    deadline_timestamp: int

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
        "network": "GenLayer StudioNet / Testnet Simulator",
        "protocol_version": "v0.1.0-alpha",
        "active_validators": len(runtime.validators),
        "validators": runtime.validators,
        "total_staked": sum(v["stake"] for v in runtime.validators),
        "consensus_mechanism": "Optimistic Democracy (GenVM Equivalence Principle)",
        "contracts_deployed": 2,
        "timestamp": int(time.time())
    }

@app.get("/api/escrows")
def get_all_escrows():
    return escrow_contract.get_all_escrows()

@app.get("/api/escrows/{escrow_id}")
def get_escrow(escrow_id: int):
    escrow = escrow_contract.get_escrow(escrow_id)
    if "error" in escrow:
        raise HTTPException(status_code=404, detail=escrow["error"])
    return escrow

@app.post("/api/escrows")
def create_escrow(req: CreateEscrowRequest):
    milestones_data = [m.dict() for m in req.milestones]
    escrow_id = escrow_contract.create_escrow(
        client=req.client,
        contractor=req.contractor or "",
        title=req.title,
        description=req.description,
        total_amount=req.total_amount,
        milestones=milestones_data,
        category=req.category or "Software Development",
        is_open_for_claim=req.is_open_for_claim or False
    )
    return {"success": True, "escrow_id": escrow_id, "escrow": escrow_contract.get_escrow(escrow_id)}

@app.post("/api/escrows/join")
def join_escrow(req: JoinEscrowRequest):
    res = escrow_contract.join_escrow(
        escrow_id=req.escrow_id,
        role=req.role,
        participant_address=req.participant_address
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to join escrow"))
    return res

@app.post("/api/escrows/submit-deliverable")
def submit_deliverable(req: SubmitDeliverableRequest):
    res = escrow_contract.submit_deliverable(
        escrow_id=req.escrow_id,
        milestone_index=req.milestone_index,
        sender=req.sender,
        deliverable_url=req.deliverable_url,
        deliverable_notes=req.deliverable_notes
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to submit"))
    return res

@app.post("/api/escrows/resolve-milestone")
def resolve_milestone(req: ResolveMilestoneRequest):
    res = escrow_contract.verify_and_resolve_milestone(
        escrow_id=req.escrow_id,
        milestone_index=req.milestone_index,
        gl_runtime=runtime
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to resolve"))
    return res

# --- TruthForge Oracle Routes ---
@app.get("/api/markets")
def get_all_markets():
    return oracle_contract.get_all_markets()

@app.get("/api/markets/{market_id}")
def get_market(market_id: int):
    market = oracle_contract.get_market(market_id)
    if "error" in market:
        raise HTTPException(status_code=404, detail=market["error"])
    return market

@app.post("/api/markets")
def create_market(req: CreateMarketRequest):
    market_id = oracle_contract.create_market(
        creator=req.creator,
        question=req.question,
        category=req.category,
        resolution_sources=req.resolution_sources,
        resolution_criteria=req.resolution_criteria,
        deadline_timestamp=req.deadline_timestamp
    )
    return {"success": True, "market_id": market_id, "market": oracle_contract.get_market(market_id)}

@app.post("/api/markets/bet")
def place_bet(req: PlaceBetRequest):
    res = oracle_contract.place_bet(
        market_id=req.market_id,
        sender=req.sender,
        side=req.side,
        amount=req.amount
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to place bet"))
    return res

@app.post("/api/markets/resolve")
def resolve_market(req: ResolveMarketRequest):
    res = oracle_contract.resolve_market(
        market_id=req.market_id,
        gl_runtime=runtime
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to resolve"))
    return res

# Serve static frontend files
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
