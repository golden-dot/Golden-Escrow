"""
test_contracts.py - Unit and Integration tests for GenLayer Intelligent Contracts
"""
import sys
import os

# Add contract path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../contracts")))

from IntelligentEscrow import IntelligentEscrow
from TruthForgeOracle import TruthForgeOracle
from genlayer_runtime import GenLayerRuntime

def test_intelligent_escrow_workflow():
    print(">>> Testing IntelligentEscrow Contract Workflow...")
    runtime = GenLayerRuntime()
    contract = IntelligentEscrow()

    # 1. Create Escrow
    client_addr = "0xAlice111111111111111111111111111111111111"
    contractor_addr = "0xBob222222222222222222222222222222222222"
    
    milestones = [
        {
            "title": "Smart Contract Audit & Test Suite",
            "description": "Perform comprehensive vulnerability audit and provide 90%+ test coverage.",
            "amount": 250.0,
            "acceptance_criteria": [
                "No high or critical vulnerabilities in audit report",
                "Full unit test suite passing",
                "Automated CI configuration file included"
            ],
            "quality_threshold_score": 80
        },
        {
            "title": "Production Deployment & Monitoring",
            "description": "Deploy to GenLayer testnet and configure validator telemetry.",
            "amount": 150.0,
            "acceptance_criteria": [
                "Contract verified on GenLayer Explorer",
                "Telemetry endpoint responding with 200 OK"
            ],
            "quality_threshold_score": 80
        }
    ]

    escrow_id = contract.create_escrow(
        client=client_addr,
        contractor=contractor_addr,
        title="GenLayer Intelligent Oracles Suite",
        description="Comprehensive decentralized milestone project with GenLayer AI arbitration.",
        total_amount=400.0,
        milestones=milestones
    )
    assert escrow_id == 1
    print(f"  ✓ Escrow #{escrow_id} successfully created with 2 milestones.")

    # 2. Contractor submits deliverable for Milestone #0
    sub_res = contract.submit_deliverable(
        escrow_id=escrow_id,
        milestone_index=0,
        sender=contractor_addr,
        deliverable_url="https://github.com/genlayer/audit-report-sample",
        deliverable_notes="Completed the audit. Zero critical vulnerabilities found. 94% test coverage reached."
    )
    assert sub_res["success"] is True
    print("  ✓ Deliverable successfully submitted by contractor.")

    # 3. Trigger GenLayer Autonomous AI Verification
    verif_res = contract.verify_and_resolve_milestone(
        escrow_id=escrow_id,
        milestone_index=0,
        gl_runtime=runtime
    )
    assert verif_res["success"] is True
    assert verif_res["is_approved"] is True
    assert verif_res["payout_released"] == 250.0
    print(f"  ✓ GenVM AI Resolution: {verif_res['resolution']['verdict']} with score {verif_res['resolution']['score']}/100")
    print(f"  ✓ Funds released: {verif_res['payout_released']} GEN (Validators agreed: {verif_res['resolution']['validators_agreed']})")

    # Check updated escrow state
    escrow = contract.get_escrow(escrow_id)
    assert escrow["milestones"][0]["status"] == "APPROVED"
    assert escrow["total_payout_released"] == 250.0
    print("  ✓ Escrow state verified.")

def test_truth_forge_oracle():
    print("\n>>> Testing TruthForgeOracle Contract Workflow...")
    runtime = GenLayerRuntime()
    oracle = TruthForgeOracle()

    market_id = oracle.create_market(
        creator="0xCharlie333333333333333333333333333333333333",
        question="Will GenLayer Intelligent Contracts reach mainnet milestone in 2026?",
        category="Blockchain & AI",
        resolution_sources=["https://genlayer.com/roadmap", "https://docs.genlayer.com"],
        resolution_criteria="Affirmative if official release announcement published on genlayer.com.",
        deadline_timestamp=1779999999
    )
    assert market_id == 1
    print(f"  ✓ TruthForge Market #{market_id} created.")

    # Place bets
    oracle.place_bet(market_id, "0xAlice1111", "YES", 50.0)
    oracle.place_bet(market_id, "0xBob2222", "NO", 20.0)
    print("  ✓ Stakes placed: 50 GEN on YES, 20 GEN on NO.")

    # Autonomous Resolution
    res = oracle.resolve_market(market_id, gl_runtime=runtime)
    assert res["success"] is True
    assert res["outcome"] in ["YES", "NO"]
    print(f"  ✓ Market #{market_id} autonomously resolved to: {res['outcome']} (Confidence: {res['resolution_details']['confidence_score']}%)")

if __name__ == "__main__":
    test_intelligent_escrow_workflow()
    test_truth_forge_oracle()
    print("\n All GenLayer Intelligent Contract tests PASSED successfully!")
