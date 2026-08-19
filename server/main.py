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

# Live Deployed Contract Addresses on GenLayer StudioNet
DEPLOYED_ESCROW_CONTRACT = "0xc40d279E9f8a48AEE0c6383A23Bf3431d0B620Ec"
DEPLOYED_ORACLE_CONTRACT = "0x503402BF6Ccadf366D269FE397B79c2CFfF011AC"

# Initialize GenLayer Runtime & Intelligent Contracts
runtime = GenLayerRuntime()
escrow_contract = IntelligentEscrow()
oracle_contract = TruthForgeOracle()

def seed_demo_data():
    # Escrow 1: DEX Router Audit
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

    # Escrow 2: Open Bounty
    escrow_contract.create_escrow(
        contractor="0x0000000000000000000000000000000000000000",
        title="GenLayer Python SDK Async WebSocket Listener Bounty",
        description="Open Community Bounty: Build high-throughput async WebSocket event subscription wrapper for GenLayer nodes with automatic reconnects.",
        category="SDK & Developer Tooling",
        requirements="Deliver modular Python package with 90%+ pytest coverage and typing annotations.",
        criteria="Fully async using asyncio and websockets. Pytest suite passing with 90%+ code coverage.",
        amount=950,
        quality_threshold=85
    )

    # Submit deliverable for Escrow 1
    escrow_contract.submit_deliverable(
        escrow_id=1,
        deliverable_url="https://github.com/genlayer/audit-router-deliverable",
        deliverable_notes="Completed invariant fuzz testing suite. 15,000 iterations executed with zero equivalence breaks."
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

seed_demo_data()

# -------------------------------------------------------------
# REST Endpoints
# -------------------------------------------------------------
@app.get("/api/status")
def get_node_status():
    return {
        "network": "GenLayer StudioNet",
        "protocol_version": "v0.2.16",
        "deployed_escrow_contract": DEPLOYED_ESCROW_CONTRACT,
        "deployed_oracle_contract": DEPLOYED_ORACLE_CONTRACT,
        "escrow_studio_url": f"https://studio.genlayer.com/contract/{DEPLOYED_ESCROW_CONTRACT}",
        "oracle_studio_url": f"https://studio.genlayer.com/contract/{DEPLOYED_ORACLE_CONTRACT}",
        "active_validators": len(runtime.validators),
        "total_staked": sum(v["stake"] for v in runtime.validators),
        "timestamp": int(time.time())
    }

@app.get("/api/escrows")
def get_all_escrows():
    return [escrow_contract.get_escrow(i) for i in range(1, int(escrow_contract.next_escrow_id))]

@app.get("/api/markets")
def get_all_markets():
    return [oracle_contract.get_market(i) for i in range(1, int(oracle_contract.next_market_id))]

# Serve static files
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../"))
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static_root")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
