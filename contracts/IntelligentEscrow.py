# v0.2.16
#
# {
#   "Seq": [
#     { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
#   ]
# }

from genlayer import *
from dataclasses import dataclass


@allow_storage
@dataclass
class Escrow:
    escrow_id: u256
    client: Address
    contractor: Address
    title: str
    description: str
    category: str
    requirements: str
    criteria: str
    amount: u256
    quality_threshold: u256
    deliverable_url: str
    deliverable_notes: str
    status: str
    decision: str
    score: u256
    payment_received: bool
    payout_address: Address


class IntelligentEscrow(gl.Contract):

    escrows: TreeMap[u256, Escrow]
    next_escrow_id: u256

    def __init__(self):
        self.next_escrow_id = u256(1)

    # =========================================================
    # CREATE ESCROW VAULT & DEPOSIT (CLIENT / BUYER)
    # =========================================================

    @gl.public.write
    def create_escrow(
        self,
        contractor: Address,
        title: str,
        description: str,
        category: str,
        requirements: str,
        criteria: str,
        amount: u256,
        quality_threshold: u256,
    ) -> u256:

        if not title:
            raise Exception("Title cannot be empty")

        if not requirements:
            raise Exception("Requirements cannot be empty")

        if not criteria:
            raise Exception("Criteria cannot be empty")

        if amount == u256(0):
            raise Exception("Escrow deposit amount must be greater than zero")

        escrow_id = self.next_escrow_id
        is_open = contractor == Address("0x0000000000000000000000000000000000000000")

        # Payment received and locked into GenLayer escrow vault upon creation
        self.escrows[escrow_id] = Escrow(
            escrow_id=escrow_id,
            client=gl.message.sender_address,
            contractor=contractor,
            title=title,
            description=description,
            category=category,
            requirements=requirements,
            criteria=criteria,
            amount=amount,
            quality_threshold=quality_threshold,
            deliverable_url="",
            deliverable_notes="",
            status="OPEN_FOR_CLAIM" if is_open else "ACTIVE",
            decision="",
            score=u256(0),
            payment_received=True,
            payout_address=Address("0x0000000000000000000000000000000000000000"),
        )

        self.next_escrow_id = escrow_id + u256(1)

        return escrow_id

    # =========================================================
    # CLAIM ESCROW TASK (BUILDER / CONTRACTOR)
    # =========================================================

    @gl.public.write
    def claim_escrow(
        self,
        escrow_id: u256,
    ) -> None:

        escrow = self.escrows[escrow_id]

        if escrow.status != "OPEN_FOR_CLAIM":
            raise Exception("Escrow is not open for claim")

        escrow.contractor = gl.message.sender_address
        escrow.status = "ACTIVE"

    # =========================================================
    # SUBMIT WORK DELIVERABLE (BUILDER)
    # =========================================================

    @gl.public.write
    def submit_deliverable(
        self,
        escrow_id: u256,
        deliverable_url: str,
        deliverable_notes: str,
    ) -> None:

        escrow = self.escrows[escrow_id]

        if escrow.status != "ACTIVE":
            raise Exception("Escrow is not active")

        if gl.message.sender_address != escrow.contractor and gl.message.sender_address != escrow.client:
            raise Exception("Only assigned contractor or client can submit deliverables")

        if not deliverable_notes:
            raise Exception("Deliverable notes cannot be empty")

        escrow.deliverable_url = deliverable_url
        escrow.deliverable_notes = deliverable_notes
        escrow.status = "SUBMITTED"

    # =========================================================
    # AI TASK ARBITRATION & VERIFICATION
    # =========================================================

    @gl.public.write
    def arbitrate(
        self,
        escrow_id: u256,
    ) -> str:

        escrow = self.escrows[escrow_id]

        if escrow.status != "SUBMITTED":
            raise Exception("Deliverable must be submitted before arbitration")

        title = escrow.title
        requirements = escrow.requirements
        criteria = escrow.criteria
        deliverable_url = escrow.deliverable_url
        deliverable_notes = escrow.deliverable_notes
        threshold = int(escrow.quality_threshold)

        # -----------------------------------------------------
        # LEADER EVALUATION
        # -----------------------------------------------------

        def evaluate():
            prompt = f"""
You are an impartial GenLayer Consensus Validator evaluating task deliverables.

PROJECT TITLE:
{title}

TASK REQUIREMENTS:
{requirements}

VALIDATION ACCEPTANCE CRITERIA:
{criteria}

MINIMUM QUALITY THRESHOLD:
{threshold}/100

DELIVERABLE URL:
{deliverable_url}

CONTRACTOR SUBMISSION NOTES:
{deliverable_notes}

Determine whether the contractor successfully fulfilled requirements.

Return ONLY JSON:
{{
    "decision": "ACCEPT" or "REJECT",
    "score": 0
}}

The score must be an integer between 0 and 100.
Rule: ACCEPT only if score >= {threshold} and requirements are satisfied.
"""
            return gl.nondet.exec_prompt(
                prompt,
                response_format="json",
            )

        # -----------------------------------------------------
        # VALIDATOR INDEPENDENT VERIFICATION
        # -----------------------------------------------------

        def validate(leader_result):
            leader = leader_result.calldata

            decision = leader.get("decision")
            score = leader.get("score")

            if decision not in ["ACCEPT", "REJECT"]:
                return False

            if not isinstance(score, int) or score < 0 or score > 100:
                return False

            validator_prompt = f"""
You are an independent validator verifying task completion on GenLayer.

PROJECT TITLE:
{title}

TASK REQUIREMENTS:
{requirements}

VALIDATION CRITERIA:
{criteria}

DELIVERABLE URL:
{deliverable_url}

CONTRACTOR NOTES:
{deliverable_notes}

LEADER DECISION:
{decision}

LEADER SCORE:
{score}

Return ONLY JSON:
{{
    "decision": "ACCEPT" or "REJECT"
}}

Independently verify whether the deliverable meets requirements.
"""
            validator = gl.nondet.exec_prompt(
                validator_prompt,
                response_format="json",
            )

            if not isinstance(validator, dict):
                return False

            return validator.get("decision") == decision

        # -----------------------------------------------------
        # GENLAYER CONSENSUS EXECUTION
        # -----------------------------------------------------

        result = gl.vm.run_nondet_unsafe(
            evaluate,
            validate,
        )

        escrow.decision = result["decision"]
        escrow.score = u256(result["score"])

        if result["decision"] == "ACCEPT":
            escrow.status = "VERIFIED_AWAITING_PAYOUT_ADDRESS"
        else:
            escrow.status = "REJECTED"

        return result["decision"]

    # =========================================================
    # CONTRACTOR PAYOUT DISBURSEMENT
    # =========================================================

    @gl.public.write
    def release_payout(
        self,
        escrow_id: u256,
        destination_address: Address,
    ) -> None:

        escrow = self.escrows[escrow_id]

        if escrow.status != "VERIFIED_AWAITING_PAYOUT_ADDRESS":
            raise Exception("Escrow is not verified or payout address already executed")

        if destination_address == Address("0x0000000000000000000000000000000000000000"):
            raise Exception("Invalid destination payout address")

        escrow.payout_address = destination_address
        escrow.status = "ACCEPTED"

    # =========================================================
    # READ VIEWS
    # =========================================================

    @gl.public.view
    def get_escrow(
        self,
        escrow_id: u256,
    ) -> dict:

        escrow = self.escrows[escrow_id]

        return {
            "escrow_id": escrow.escrow_id,
            "client": escrow.client,
            "contractor": escrow.contractor,
            "title": escrow.title,
            "description": escrow.description,
            "category": escrow.category,
            "requirements": escrow.requirements,
            "criteria": escrow.criteria,
            "amount": escrow.amount,
            "quality_threshold": escrow.quality_threshold,
            "deliverable_url": escrow.deliverable_url,
            "deliverable_notes": escrow.deliverable_notes,
            "status": escrow.status,
            "decision": escrow.decision,
            "score": escrow.score,
            "payment_received": escrow.payment_received,
            "payout_address": escrow.payout_address,
        }

    @gl.public.view
    def get_status(
        self,
        escrow_id: u256,
    ) -> str:
        return self.escrows[escrow_id].status
