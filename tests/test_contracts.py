"""
test_contracts.py - Unit and Integration tests for GenLayer Intelligent Contracts
"""
import sys
import os

# Add contract path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../contracts")))

from genlayer import Address, u256, gl
from IntelligentEscrow import (
    IntelligentEscrow,
    STATE_CREATED,
    STATE_OPEN_FOR_CLAIM,
    STATE_ACTIVE,
    STATE_SUBMITTED,
    STATE_PAYOUT_CLAIMABLE,
    STATE_PAYOUT_CLAIMED
)
from TruthForgeOracle import TruthForgeOracle
from genlayer_runtime import GenLayerRuntime

def test_intelligent_escrow_workflow():
    print(">>> Testing IntelligentEscrow Contract Workflow...")
    runtime = GenLayerRuntime()
    contract = IntelligentEscrow()

    client_addr = Address("0x1111111111111111111111111111111111111111")
    contractor_addr = Address("0x2222222222222222222222222222222222222222")
    zero_addr = Address("0x0000000000000000000000000000000000000000")

    # 1. Create Escrow as Client
    gl.set_message_sender(client_addr)
    escrow_id = contract.create_escrow(
        contractor=zero_addr,
        title="Smart Contract Audit & Remediation Suite",
        description="Comprehensive GenLayer security remediation and test suite creation.",
        category="Security",
        requirements="Audit contract state machine, authorization, and asset custody invariants.",
        criteria="Zero critical vulnerabilities and full automated test suite passing.",
        amount=u256(400),
        quality_threshold=u256(80)
    )
    assert escrow_id == u256(1)
    escrow_data = contract.get_escrow(escrow_id)
    assert escrow_data["status"] == STATE_CREATED
    assert escrow_data["deposited_amount"] == u256(0)
    print(f"  ✓ Escrow #{escrow_id} successfully created in CREATED state.")

    # 2. Client Deposits Funds to Vault
    contract.deposit_funds(escrow_id, u256(400))
    escrow_data = contract.get_escrow(escrow_id)
    assert escrow_data["status"] == STATE_OPEN_FOR_CLAIM
    assert escrow_data["deposited_amount"] == u256(400)
    assert escrow_data["remaining_amount"] == u256(400)
    print("  ✓ Escrow deposit confirmed on-chain. State transitioned to OPEN_FOR_CLAIM.")

    # 3. Contractor Claims Bounty Task
    gl.set_message_sender(contractor_addr)
    contract.claim_escrow(escrow_id)
    escrow_data = contract.get_escrow(escrow_id)
    assert escrow_data["status"] == STATE_ACTIVE
    assert escrow_data["contractor"] == contractor_addr
    print("  ✓ Bounty claimed by contractor. State transitioned to ACTIVE.")

    # 4. Contractor Submits Deliverable
    contract.submit_deliverable(
        escrow_id=escrow_id,
        deliverable_url="https://github.com/golden-dot/Golden-Escrow",
        deliverable_notes="Completed 16-phase security remediation with 100% test pass rate."
    )
    escrow_data = contract.get_escrow(escrow_id)
    assert escrow_data["status"] == STATE_SUBMITTED
    assert len(escrow_data["evidence_hash"]) == 64
    print("  ✓ Deliverable submitted with SHA-256 evidence hash. State transitioned to SUBMITTED.")

    # 5. AI Arbitration & Consensus Evaluation
    new_status = contract.arbitrate(escrow_id)
    escrow_data = contract.get_escrow(escrow_id)
    assert new_status == STATE_PAYOUT_CLAIMABLE
    assert escrow_data["decision"] == "ACCEPT"
    assert escrow_data["score"] >= u256(80)
    print(f"  ✓ GenVM AI Consensus Verdict: {escrow_data['decision']} with Score {escrow_data['score']}/100.")

    # 6. Release Payout to Contractor Address
    contract.release_payout(escrow_id)
    escrow_data = contract.get_escrow(escrow_id)
    assert escrow_data["status"] == STATE_PAYOUT_CLAIMED
    assert escrow_data["released_amount"] == u256(400)
    assert escrow_data["remaining_amount"] == u256(0)
    # Verify Invariant: deposited = released + refunded + remaining
    assert escrow_data["deposited_amount"] == escrow_data["released_amount"] + escrow_data["refunded_amount"] + escrow_data["remaining_amount"]
    print("  ✓ Payout disburse confirmed. Accounting invariant verified: deposited = released + refunded + remaining.")

def test_truth_forge_oracle():
    print("\n>>> Testing TruthForgeOracle Contract Workflow...")
    oracle = TruthForgeOracle()
    creator_addr = Address("0x3333333333333333333333333333333333333333")

    gl.set_message_sender(creator_addr)
    market_id = oracle.create_market(
        question="Will GenLayer Intelligent Contracts reach mainnet milestone in 2026?",
        category="Blockchain & AI",
        sources="https://genlayer.com/roadmap, https://docs.genlayer.com",
        criteria="Affirmative if official release announcement published on genlayer.com."
    )
    assert market_id == u256(1)
    print(f"  ✓ TruthForge Market #{market_id} created.")

    oracle.place_stake(market_id, "YES", u256(50))
    oracle.place_stake(market_id, "NO", u256(20))
    print("  ✓ Stakes placed: 50 GEN on YES, 20 GEN on NO.")

    outcome = oracle.resolve_market(market_id)
    assert outcome in ["YES", "NO"]
    print(f"  ✓ Market #{market_id} autonomously resolved to: {outcome}")

if __name__ == "__main__":
    test_intelligent_escrow_workflow()
    test_truth_forge_oracle()
    print("\n All GenLayer Intelligent Contract tests PASSED successfully!")
