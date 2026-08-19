"""
main.py - FastAPI Indexing Server & Smart Contract Interface for GenLayer Intellex Protocol
Authoritative State: GenLayer Intelligent Contract (IntelligentEscrow.py)
Network: GenLayer Bradbury
"""
import os
import sys
import time
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Add contracts path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../contracts")))

from genlayer import Address, u256, gl
from IntelligentEscrow import (
    IntelligentEscrow,
    STATE_CREATED,
    STATE_FUNDED,
    STATE_OPEN_FOR_CLAIM,
    STATE_ACTIVE,
    STATE_SUBMITTED,
    STATE_VERIFYING,
    STATE_APPROVED,
    STATE_REJECTED,
    STATE_DISPUTED,
    STATE_APPEALED,
    STATE_PAYOUT_CLAIMABLE,
    STATE_PAYOUT_CLAIMED,
    STATE_REFUNDABLE,
    STATE_REFUNDED,
    STATE_EXPIRED,
    STATE_CANCELLED
)
from TruthForgeOracle import TruthForgeOracle
from genlayer_runtime import GenLayerRuntime

app = FastAPI(
    title="GenLayer Intellex Protocol API",
    description="Autonomous AI-Governed Escrow & Truth Oracle Platform on GenLayer Bradbury",
    version="0.3.0"
)

# Phase 13 Security Remediation: Restrict CORS origins (No wildcard '*' with credentials)
ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://golden-escrow.vercel.app",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Live Deployed Contract Addresses on GenLayer Bradbury
DEPLOYED_ESCROW_CONTRACT = "0x3Fc6Ba2C953Bdc8d80AFd1599B9EE245C0761827"
DEPLOYED_ORACLE_CONTRACT = "0xF4137609FEa2259a2ea1814D540a3c7a8b4fdD6F"

# Initialize GenLayer Runtime & Intelligent Contracts (On-Chain Single Source of Truth)
runtime = GenLayerRuntime()
escrow_contract = IntelligentEscrow()
oracle_contract = TruthForgeOracle()

# Request Models
class CreateEscrowRequest(BaseModel):
    client_address: str = Field(..., max_length=42)
    contractor_address: Optional[str] = Field("0x0000000000000000000000000000000000000000", max_length=42)
    title: str = Field(..., max_length=200)
    description: str = Field("", max_length=4000)
    category: str = Field("General", max_length=100)
    requirements: str = Field(..., max_length=2000)
    criteria: str = Field(..., max_length=2000)
    amount: float = Field(..., gt=0)
    quality_threshold: int = Field(80, ge=0, le=100)

class DepositRequest(BaseModel):
    client_address: str = Field(..., max_length=42)
    deposit_amount: float = Field(..., gt=0)

class ClaimRequest(BaseModel):
    contractor_address: str = Field(..., max_length=42)

class SubmitDeliverableRequest(BaseModel):
    contractor_address: str = Field(..., max_length=42)
    deliverable_url: str = Field(..., max_length=1000)
    deliverable_notes: str = Field(..., max_length=4000)

class ReleasePayoutRequest(BaseModel):
    caller_address: str = Field(..., max_length=42)

class AppealRequest(BaseModel):
    contractor_address: str = Field(..., max_length=42)
    new_deliverable_url: str = Field(..., max_length=1000)
    new_deliverable_notes: str = Field(..., max_length=4000)

class RefundRequest(BaseModel):
    client_address: str = Field(..., max_length=42)

# Helper function to serialize escrow contract dict
def format_escrow_response(e_dict: dict) -> dict:
    return {
        "escrow_id": int(e_dict["escrow_id"]),
        "client": str(e_dict["client"]),
        "contractor": str(e_dict["contractor"]),
        "title": e_dict["title"],
        "description": e_dict["description"],
        "category": e_dict["category"],
        "requirements": e_dict["requirements"],
        "criteria": e_dict["criteria"],
        "deposited_amount": float(e_dict["deposited_amount"]),
        "released_amount": float(e_dict["released_amount"]),
        "refunded_amount": float(e_dict["refunded_amount"]),
        "remaining_amount": float(e_dict["remaining_amount"]),
        "amount": float(e_dict["deposited_amount"] if e_dict["deposited_amount"] > 0 else e_dict["remaining_amount"]),
        "quality_threshold": int(e_dict["quality_threshold"]),
        "deliverable_url": e_dict["deliverable_url"],
        "deliverable_notes": e_dict["deliverable_notes"],
        "status": e_dict["status"],
        "decision": e_dict["decision"],
        "score": int(e_dict["score"]),
        "payout_address": str(e_dict["payout_address"]),
        "appeal_count": int(e_dict["appeal_count"]),
        "evidence_hash": e_dict["evidence_hash"],
        "payment_received": float(e_dict["deposited_amount"]) > 0 or e_dict["status"] in [STATE_OPEN_FOR_CLAIM, STATE_ACTIVE, STATE_SUBMITTED, STATE_APPROVED, STATE_PAYOUT_CLAIMABLE]
    }

# -------------------------------------------------------------
# AUTHORITATIVE CONTRACT READ ENDPOINTS
# -------------------------------------------------------------

@app.get("/api/status")
def get_node_status():
    return {
        "network": "GenLayer Bradbury",
        "protocol_version": "v0.3.0-remediated",
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
    """Reads authoritative escrow state directly from IntelligentContract storage."""
    results = []
    max_id = int(escrow_contract.next_escrow_id)
    for i in range(1, max_id):
        try:
            e_dict = escrow_contract.get_escrow(u256(i))
            results.append(format_escrow_response(e_dict))
        except Exception:
            continue
    return results

@app.get("/api/escrows/{escrow_id}")
def get_escrow_by_id(escrow_id: int):
    try:
        e_dict = escrow_contract.get_escrow(u256(escrow_id))
        return format_escrow_response(e_dict)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Escrow #{escrow_id} not found: {str(e)}")

# -------------------------------------------------------------
# AUTHORITATIVE CONTRACT TRANSACTION ENDPOINTS
# -------------------------------------------------------------

@app.post("/api/escrows/create")
def create_escrow_endpoint(req: CreateEscrowRequest):
    try:
        gl.set_message_sender(req.client_address)
        escrow_id = escrow_contract.create_escrow(
            contractor=Address(req.contractor_address),
            title=req.title,
            description=req.description,
            category=req.category,
            requirements=req.requirements,
            criteria=req.criteria,
            amount=u256(int(req.amount)),
            quality_threshold=u256(req.quality_threshold)
        )
        e_dict = escrow_contract.get_escrow(escrow_id)
        return {"success": True, "escrow_id": int(escrow_id), "escrow": format_escrow_response(e_dict)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/escrows/{escrow_id}/deposit")
def deposit_funds_endpoint(escrow_id: int, req: DepositRequest):
    try:
        gl.set_message_sender(req.client_address, value=int(req.deposit_amount))
        escrow_contract.deposit_funds(u256(escrow_id), u256(int(req.deposit_amount)))
        e_dict = escrow_contract.get_escrow(u256(escrow_id))
        return {"success": True, "message": "Funds deposited and verified on-chain", "escrow": format_escrow_response(e_dict)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/escrows/{escrow_id}/claim")
def claim_escrow_endpoint(escrow_id: int, req: ClaimRequest):
    try:
        gl.set_message_sender(req.contractor_address)
        escrow_contract.claim_escrow(u256(escrow_id))
        e_dict = escrow_contract.get_escrow(u256(escrow_id))
        return {"success": True, "message": "Claimed escrow task", "escrow": format_escrow_response(e_dict)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/escrows/{escrow_id}/submit")
def submit_deliverable_endpoint(escrow_id: int, req: SubmitDeliverableRequest):
    try:
        gl.set_message_sender(req.contractor_address)
        escrow_contract.submit_deliverable(
            u256(escrow_id),
            deliverable_url=req.deliverable_url,
            deliverable_notes=req.deliverable_notes
        )
        e_dict = escrow_contract.get_escrow(u256(escrow_id))
        return {"success": True, "message": "Deliverable submitted to Intelligent Contract", "escrow": format_escrow_response(e_dict)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/escrows/{escrow_id}/arbitrate")
def arbitrate_endpoint(escrow_id: int):
    try:
        new_status = escrow_contract.arbitrate(u256(escrow_id))
        e_dict = escrow_contract.get_escrow(u256(escrow_id))
        return {"success": True, "status": new_status, "escrow": format_escrow_response(e_dict)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/escrows/{escrow_id}/payout")
def release_payout_endpoint(escrow_id: int, req: ReleasePayoutRequest):
    try:
        gl.set_message_sender(req.caller_address)
        escrow_contract.release_payout(u256(escrow_id))
        e_dict = escrow_contract.get_escrow(u256(escrow_id))
        return {"success": True, "message": "Payout released", "escrow": format_escrow_response(e_dict)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/escrows/{escrow_id}/appeal")
def appeal_endpoint(escrow_id: int, req: AppealRequest):
    try:
        gl.set_message_sender(req.contractor_address)
        escrow_contract.appeal_rejection(
            u256(escrow_id),
            new_deliverable_url=req.new_deliverable_url,
            new_deliverable_notes=req.new_deliverable_notes
        )
        e_dict = escrow_contract.get_escrow(u256(escrow_id))
        return {"success": True, "message": "Appeal submitted", "escrow": format_escrow_response(e_dict)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/escrows/{escrow_id}/refund")
def claim_refund_endpoint(escrow_id: int, req: RefundRequest):
    try:
        gl.set_message_sender(req.client_address)
        escrow_contract.claim_refund(u256(escrow_id))
        e_dict = escrow_contract.get_escrow(u256(escrow_id))
        return {"success": True, "message": "Refund processed", "escrow": format_escrow_response(e_dict)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/markets")
def get_all_markets():
    return [oracle_contract.get_market(u256(i)) for i in range(1, int(oracle_contract.next_market_id))]

# Serve static files
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../"))
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static_root")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
