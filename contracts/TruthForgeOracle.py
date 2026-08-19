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
        self.markets = TreeMap()
        self.next_market_id = u256(1)

    # =========================================================
    # CREATE MARKET
    # =========================================================

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

    # =========================================================
    # STAKE ON OUTCOME
    # =========================================================

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

    # =========================================================
    # RESOLVE MARKET (GENLAYER CONSENSUS)
    # =========================================================

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

        # -----------------------------------------------------
        # LEADER EVALUATION
        # -----------------------------------------------------

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

        # -----------------------------------------------------
        # VALIDATOR INDEPENDENT VERIFICATION
        # -----------------------------------------------------

        def validate(leader_result):
            leader = leader_result.calldata

            outcome = leader.get("outcome")
            confidence = leader.get("confidence") or leader.get("confidence_score", 95)

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

        # -----------------------------------------------------
        # GENLAYER CONSENSUS EXECUTION
        # -----------------------------------------------------

        result = gl.vm.run_nondet_unsafe(
            evaluate,
            validate,
        )

        market.outcome = result["outcome"]
        market.confidence = u256(result.get("confidence", 95))
        market.status = "RESOLVED"

        return result["outcome"]

    # =========================================================
    # VIEWS
    # =========================================================

    @gl.public.view
    def get_market(
        self,
        market_id: u256,
    ) -> dict:

        market = self.markets[market_id]

        return {
            "market_id": market.market_id,
            "creator": market.creator,
            "question": market.question,
            "category": market.category,
            "sources": market.sources,
            "criteria": market.criteria,
            "total_yes": market.total_yes,
            "total_no": market.total_no,
            "status": market.status,
            "outcome": market.outcome,
            "confidence": market.confidence,
        }

    @gl.public.view
    def get_status(
        self,
        market_id: u256,
    ) -> str:
        return self.markets[market_id].status

    @gl.public.view
    def get_outcome(
        self,
        market_id: u256,
    ) -> str:
        return self.markets[market_id].outcome
