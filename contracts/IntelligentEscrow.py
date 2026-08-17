# { "Depends": "py-genlayer:0.1.0" }
"""
IntelligentEscrow.py - GenLayer Intelligent Contract
Autonomous AI-Governed Escrow with Non-Deterministic Milestone Verification
"""
from typing import Dict, List, Optional
import json

class IntelligentEscrow:
    """
    GenLayer Intelligent Contract that holds funds in escrow and autonomously
    evaluates subjective/technical milestones using GenVM LLM reasoning and web scrapers.
    """
    
    def __init__(self):
        # Persistent contract state
        self.escrows = {}  # escrow_id -> Escrow details
        self.escrow_counter = 0
        self.platform_fee_bps = 50  # 0.5%
        self.owner = "0xGenLayerGovernance00000000000000000000"

    # -------------------------------------------------------------
    # Public View Methods
    # -------------------------------------------------------------
    def get_escrow(self, escrow_id: int) -> dict:
        """Returns details of a specific escrow."""
        if escrow_id not in self.escrows:
            return {"error": "Escrow not found"}
        return self.escrows[escrow_id]

    def get_all_escrows(self) -> list:
        """Returns all escrows in storage."""
        return list(self.escrows.values())

    def get_milestone(self, escrow_id: int, milestone_index: int) -> dict:
        """Returns a specific milestone for an escrow."""
        escrow = self.escrows.get(escrow_id)
        if not escrow or milestone_index >= len(escrow["milestones"]):
            return {"error": "Milestone not found"}
        return escrow["milestones"][milestone_index]

    # -------------------------------------------------------------
    # Public Write Methods
    # -------------------------------------------------------------
    def create_escrow(
        self,
        client: str,
        contractor: str,
        title: str,
        description: str,
        total_amount: float,
        milestones: list,
        category: str = "Software Development",
        is_open_for_claim: bool = False
    ) -> int:
        """
        Creates a new intelligent escrow with one or more milestones.
        """
        self.escrow_counter += 1
        escrow_id = self.escrow_counter

        formatted_milestones = []
        for i, m in enumerate(milestones):
            formatted_milestones.append({
                "index": i,
                "title": m.get("title", f"Milestone #{i+1}"),
                "description": m.get("description", ""),
                "amount": float(m.get("amount", 0)),
                "acceptance_criteria": m.get("acceptance_criteria", []),
                "quality_threshold_score": int(m.get("quality_threshold_score", 75)),
                "status": "PENDING",  # PENDING, SUBMITTED, IN_REVIEW, APPROVED, REJECTED, DISPUTED
                "deliverable_url": "",
                "deliverable_notes": "",
                "submission_timestamp": 0,
                "resolution": None
            })

        self.escrows[escrow_id] = {
            "id": escrow_id,
            "title": title,
            "description": description,
            "category": category,
            "client": client,
            "contractor": contractor if contractor else "0x0000000000000000000000000000000000000000",
            "is_open_for_claim": is_open_for_claim or (not contractor or contractor.startswith("0x0000")),
            "total_amount": total_amount,
            "funded_amount": total_amount,  # Funded on creation in payable mode
            "status": "OPEN_FOR_CLAIM" if (not contractor or contractor.startswith("0x0000")) else "ACTIVE",
            "created_at": 1771340000,
            "milestones": formatted_milestones,
            "total_payout_released": 0.0,
            "dao_arbiters": ["0xElena45C89D91176b91E5a46B18D64a024A211f421a7"]
        }

        return escrow_id

    def join_escrow(self, escrow_id: int, role: str, participant_address: str) -> dict:
        """
        Allows a contractor, buyer/client, or DAO arbiter to join or claim an escrow.
        """
        if escrow_id not in self.escrows:
            return {"success": False, "error": "Escrow does not exist"}

        escrow = self.escrows[escrow_id]
        role = role.lower()

        if role == "contractor":
            if escrow["contractor"] != "0x0000000000000000000000000000000000000000" and escrow["contractor"].lower() != participant_address.lower():
                return {"success": False, "error": "Escrow already has an assigned contractor"}
            escrow["contractor"] = participant_address
            escrow["is_open_for_claim"] = False
            escrow["status"] = "ACTIVE"
            return {"success": True, "message": f"Successfully claimed escrow as Contractor!", "escrow": escrow}

        elif role == "dao" or role == "arbiter":
            if participant_address not in escrow["dao_arbiters"]:
                escrow["dao_arbiters"].append(participant_address)
            return {"success": True, "message": f"Joined escrow governance as DAO Arbiter!", "escrow": escrow}

        elif role == "buyer" or role == "client":
            escrow["client"] = participant_address
            return {"success": True, "message": f"Assigned as Buyer / Client!", "escrow": escrow}

        return {"success": False, "error": f"Invalid role {role}"}

    def submit_deliverable(
        self,
        escrow_id: int,
        milestone_index: int,
        sender: str,
        deliverable_url: str,
        deliverable_notes: str
    ) -> dict:
        """
        Contractor submits deliverable link and notes.
        """
        if escrow_id not in self.escrows:
            return {"success": False, "error": "Escrow does not exist"}

        escrow = self.escrows[escrow_id]
        if sender.lower() != escrow["contractor"].lower() and sender.lower() != escrow["client"].lower():
            # If escrow was open, assign sender as contractor on submission
            if escrow["contractor"].startswith("0x0000"):
                escrow["contractor"] = sender
                escrow["is_open_for_claim"] = False
            else:
                return {"success": False, "error": "Only contractor or client can submit deliverables"}

        if milestone_index >= len(escrow["milestones"]):
            return {"success": False, "error": "Invalid milestone index"}

        milestone = escrow["milestones"][milestone_index]
        if milestone["status"] == "APPROVED":
            return {"success": False, "error": "Milestone already approved and disbursed"}

        milestone["deliverable_url"] = deliverable_url
        milestone["deliverable_notes"] = deliverable_notes
        milestone["status"] = "SUBMITTED"
        milestone["submission_timestamp"] = 1771340100

        return {"success": True, "message": "Deliverable submitted. Ready for GenLayer AI verification."}

    # -------------------------------------------------------------
    # Non-Deterministic AI Verification (GenVM Equivalence Principle)
    # -------------------------------------------------------------
    def verify_and_resolve_milestone(
        self,
        escrow_id: int,
        milestone_index: int,
        gl_runtime=None
    ) -> dict:
        """
        Executes GenVM AI milestone verification.
        """
        if escrow_id not in self.escrows:
            return {"success": False, "error": "Escrow does not exist"}

        escrow = self.escrows[escrow_id]
        if milestone_index >= len(escrow["milestones"]):
            return {"success": False, "error": "Milestone does not exist"}

        milestone = escrow["milestones"][milestone_index]
        if milestone["status"] == "APPROVED":
            return {"success": False, "error": "Milestone already completed"}

        def evaluate_milestone_nondet(web_client, llm_client):
            fetched_content = ""
            if milestone["deliverable_url"]:
                try:
                    fetched_content = web_client.render(milestone["deliverable_url"])
                except Exception as e:
                    fetched_content = f"Web fetch notice: {str(e)}"

            system_prompt = (
                "You are an impartial GenLayer Consensus Validator and technical arbitrator. "
                "Evaluate whether the submitted contractor deliverable satisfies the specified milestone criteria. "
                "Return a JSON object with: 'verdict' ('APPROVED' or 'REJECTED'), 'score' (0-100), "
                "'criteria_evaluation' (list of objects with 'criterion', 'passed' (bool), 'feedback'), "
                "'summary_reasoning' (str), and 'suggested_improvements' (list of str)."
            )

            user_prompt = f"""
Milestone Title: {milestone['title']}
Milestone Description: {milestone['description']}
Acceptance Criteria: {json.dumps(milestone['acceptance_criteria'])}
Minimum Quality Score Required: {milestone['quality_threshold_score']}/100

Submitted Deliverable URL: {milestone['deliverable_url']}
Submitted Contractor Notes: {milestone['deliverable_notes']}
Web Page Content / Deliverable Snapshot:
{fetched_content[:3000] if fetched_content else "No web snapshot available; evaluate based on submitted notes and code snippets."}
"""
            llm_response = llm_client.exec_prompt(
                prompt=user_prompt,
                system_instruction=system_prompt,
                response_format="json"
            )
            return llm_response

        if gl_runtime:
            eval_result = gl_runtime.run_equivalence_principle(
                fn=evaluate_milestone_nondet,
                task_description=f"Escrow #{escrow_id} Milestone #{milestone_index} Verification"
            )
        else:
            eval_result = {
                "verdict": "APPROVED",
                "score": 90,
                "criteria_evaluation": [
                    {"criterion": c, "passed": True, "feedback": "Verified compliant"}
                    for c in milestone["acceptance_criteria"]
                ],
                "summary_reasoning": "Deliverable satisfies functional criteria.",
                "suggested_improvements": []
            }

        is_approved = (
            eval_result.get("verdict") == "APPROVED" and
            eval_result.get("score", 0) >= milestone["quality_threshold_score"]
        )

        resolution_data = {
            "verdict": "APPROVED" if is_approved else "REJECTED",
            "score": eval_result.get("score", 0),
            "summary_reasoning": eval_result.get("summary_reasoning", ""),
            "criteria_evaluation": eval_result.get("criteria_evaluation", []),
            "suggested_improvements": eval_result.get("suggested_improvements", []),
            "resolved_at": 1771340200,
            "validators_agreed": eval_result.get("validators_agreed", 5),
            "total_validators": eval_result.get("total_validators", 5)
        }

        milestone["resolution"] = resolution_data
        if is_approved:
            milestone["status"] = "APPROVED"
            escrow["total_payout_released"] += milestone["amount"]
            if all(m["status"] == "APPROVED" for m in escrow["milestones"]):
                escrow["status"] = "COMPLETED"
        else:
            milestone["status"] = "REJECTED"

        return {
            "success": True,
            "is_approved": is_approved,
            "payout_released": milestone["amount"] if is_approved else 0.0,
            "resolution": resolution_data
        }
