/**
 * contracts_code.js - Embedded Python Intelligent Contracts for In-App Code Inspector
 * Copy-paste ready for GenLayer Studio v0.2.16!
 */

window.GENLAYER_CONTRACTS = {
  IntelligentEscrow: `# v0.2.16
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
`,

  TruthForgeOracle: `# v0.2.16
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
class Market:
    market_id: u256
    creator: Address
    question: str
    category: str
    sources: str
    criteria: str
    total_yes: u256
    total_no: u256
    status: str
    outcome: str
    confidence: u256


class TruthForgeOracle(gl.Contract):

    markets: TreeMap[u256, Market]
    next_market_id: u256

    def __init__(self):
        self.next_market_id = u256(1)

    @gl.public.write
    def create_market(
        self,
        question: str,
        category: str,
        sources: str,
        criteria: str,
    ) -> u256:

        if not question:
            raise Exception("Question cannot be empty")

        if not criteria:
            raise Exception("Criteria cannot be empty")

        market_id = self.next_market_id

        self.markets[market_id] = Market(
            market_id=market_id,
            creator=gl.message.sender_address,
            question=question,
            category=category,
            sources=sources,
            criteria=criteria,
            total_yes=u256(0),
            total_no=u256(0),
            status="OPEN",
            outcome="",
            confidence=u256(0),
        )

        self.next_market_id = market_id + u256(1)

        return market_id

    @gl.public.write
    def place_stake(
        self,
        market_id: u256,
        side: str,
        amount: u256,
    ) -> None:

        market = self.markets[market_id]

        if market.status != "OPEN":
            raise Exception("Market is not open for staking")

        if side.upper() == "YES":
            market.total_yes += amount
        elif side.upper() == "NO":
            market.total_no += amount
        else:
            raise Exception("Side must be YES or NO")

    @gl.public.write
    def resolve_market(
        self,
        market_id: u256,
    ) -> str:

        market = self.markets[market_id]

        if market.status != "OPEN":
            raise Exception("Market is not open")

        question = market.question
        criteria = market.criteria
        sources = market.sources

        def evaluate():
            prompt = f"""
You are an autonomous GenLayer Truth Oracle.

QUESTION TO VERIFY:
{question}

RESOLUTION CRITERIA:
{criteria}

VERIFIED DATA SOURCES:
{sources}

Determine the true real-world outcome based on criteria.

Return ONLY JSON:
{{
    "outcome": "YES" or "NO",
    "confidence": 95
}}

Rule:
- YES if the event or fact is verified.
- NO if the event did not occur or criteria fails.
- Confidence must be an integer between 0 and 100.
"""
            return gl.nondet.exec_prompt(
                prompt,
                response_format="json",
            )

        def validate(leader_result):
            leader = leader_result.calldata

            outcome = leader.get("outcome")
            confidence = leader.get("confidence")

            if outcome not in ["YES", "NO"]:
                return False

            if not isinstance(confidence, int) or confidence < 0 or confidence > 100:
                return False

            validator_prompt = f"""
You are an independent validator verifying a truth oracle market on GenLayer.

QUESTION:
{question}

RESOLUTION CRITERIA:
{criteria}

VERIFIED SOURCES:
{sources}

LEADER OUTCOME:
{outcome}

LEADER CONFIDENCE:
{confidence}

Return ONLY JSON:
{{
    "outcome": "YES" or "NO"
}}

Independently inspect the sources and criteria.
"""
            validator = gl.nondet.exec_prompt(
                validator_prompt,
                response_format="json",
            )

            if not isinstance(validator, dict):
                return False

            return validator.get("outcome") == outcome

        result = gl.vm.run_nondet_unsafe(
            evaluate,
            validate,
        )

        market.outcome = result["outcome"]
        market.confidence = u256(result.get("confidence", 95))
        market.status = "RESOLVED"

        return result["outcome"]
`
};
