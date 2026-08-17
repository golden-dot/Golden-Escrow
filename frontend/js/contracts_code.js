// Embedded Python contract source code for GenLayer In-Browser Explorer

window.GENLAYER_CONTRACTS = {
  IntelligentEscrow: `# { "Depends": "py-genlayer:0.1.0" }
from typing import Dict, List
import json

class IntelligentEscrow(gl.Contract):
    """
    GenLayer Intelligent Contract: Autonomous Milestone Verification & Escrow
    Uses GenVM Non-Deterministic LLM evaluation and live web rendering.
    """
    escrows: TreeMap[int, dict]
    escrow_counter: int

    def __init__(self):
        self.escrows = TreeMap()
        self.escrow_counter = 0

    @gl.public.view
    def get_escrow(self, escrow_id: int) -> dict:
        return self.escrows.get(escrow_id, {})

    @gl.public.write
    def create_escrow(self, client: Address, contractor: Address, title: str, milestones: list) -> int:
        self.escrow_counter += 1
        self.escrows[self.escrow_counter] = {
            "id": self.escrow_counter,
            "client": client,
            "contractor": contractor,
            "title": title,
            "milestones": milestones,
            "status": "ACTIVE"
        }
        return self.escrow_counter

    @gl.public.write
    def resolve_milestone(self, escrow_id: int, milestone_idx: int) -> dict:
        escrow = self.escrows[escrow_id]
        m = escrow["milestones"][milestone_idx]

        # GenVM Non-Deterministic Consensus Block
        def nondet_eval():
            # 1. Scrape deliverable web snapshot
            web_data = gl.nondet.web.render(m["deliverable_url"])
            
            # 2. Impartial LLM validator reasoning
            prompt = f"Milestone: {m['title']}\\nCriteria: {m['acceptance_criteria']}\\nDeliverable: {web_data}"
            return gl.nondet.exec_prompt(prompt)

        # Equivalence Principle consensus across validator committee
        result = gl.eq_principle.prompt_non_comparative(
            nondet_eval,
            criteria="Verify code quality, security, and criteria compliance."
        )

        if result.get("verdict") == "APPROVED":
            m["status"] = "APPROVED"
            # Release funds to contractor
            gl.message.transfer(escrow["contractor"], m["amount"])
            
        return result`,

  TruthForgeOracle: `# { "Depends": "py-genlayer:0.1.0" }
from typing import Dict, List
import json

class TruthForgeOracle(gl.Contract):
    """
    GenLayer Intelligent Contract: Autonomous Fact Resolution & Prediction Market
    Resolves outcomes using live multi-source web scraping & validator consensus.
    """
    markets: TreeMap[int, dict]
    market_counter: int

    def __init__(self):
        self.markets = TreeMap()
        self.market_counter = 0

    @gl.public.view
    def get_market(self, market_id: int) -> dict:
        return self.markets.get(market_id, {})

    @gl.public.write
    def create_market(self, question: str, sources: list, criteria: str) -> int:
        self.market_counter += 1
        self.markets[self.market_counter] = {
            "id": self.market_counter,
            "question": question,
            "sources": sources,
            "criteria": criteria,
            "status": "OPEN",
            "yes_pool": 0,
            "no_pool": 0
        }
        return self.market_counter

    @gl.public.write
    def resolve_market(self, market_id: int) -> dict:
        market = self.markets[market_id]

        def nondet_fact_check():
            # Multi-source web crawl
            data = [gl.nondet.web.render(url) for url in market["sources"]]
            prompt = f"Question: {market['question']}\\nEvidence: {data}"
            return gl.nondet.exec_prompt(prompt)

        # Validator consensus voting
        outcome = gl.eq_principle.strict_eq(nondet_fact_check)
        market["outcome"] = outcome["verdict"]
        market["status"] = "RESOLVED"
        return outcome`
};
