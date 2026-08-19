"""
main.py - FastAPI Application Server for GenLayer Intellex Protocol
Connects Frontend dApp with GenLayer Intelligent Contracts & GenVM Runtime.
Network: GenLayer Bradbury
"""
import os
import sys
import time
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body
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
    description="Autonomous AI-Governed Escrow & Truth Oracle Platform on GenLayer Bradbury",
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

# Live Deployed Contract Addresses on GenLayer Bradbury
DEPLOYED_ESCROW_CONTRACT = "0xc40d279E9f8a48AEE0c6383A23Bf3431d0B620Ec"
DEPLOYED_ORACLE_CONTRACT = "0x503402BF6Ccadf366D269FE397B79c2CFfF011AC"

# Initialize GenLayer Runtime & Intelligent Contracts (Clean State)
runtime = GenLayerRuntime()
escrow_contract = IntelligentEscrow()
oracle_contract = TruthForgeOracle()

ESCROWS_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "escrows_db.json"))

def load_escrows_from_file():
    if os.path.exists(ESCROWS_FILE):
        try:
            with open(ESCROWS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_escrows_to_file(data):
    with open(ESCROWS_FILE, "w") as f:
        json.dump(data, f, indent=2)

# -------------------------------------------------------------
# REST Endpoints
# -------------------------------------------------------------
@app.get("/api/status")
def get_node_status():
    return {
        "network": "GenLayer Bradbury",
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
    return load_escrows_from_file()

@app.post("/api/escrows/sync")
def sync_all_escrows(data: list = Body(...)):
    save_escrows_to_file(data)
    return {"status": "success", "count": len(data)}

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
