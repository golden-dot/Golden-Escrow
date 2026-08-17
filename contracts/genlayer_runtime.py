"""
genlayer_runtime.py - GenLayer Virtual Machine (GenVM) Execution Engine & Validator Consensus
Simulates GenLayer Optimistic Democracy consensus, non-deterministic web access, and LLM reasoning.
"""
import os
import json
import time
import urllib.request
import urllib.parse
from typing import Callable, Any, Dict, List

class GenVMWebClient:
    """Simulates GenVM non-deterministic web scraping module (gl.nondet.web)."""
    
    def render(self, url: str, mode: str = "text") -> str:
        """Fetches web page content with timeout and sanitization."""
        if not url or not url.startswith(("http://", "https://")):
            return f"Mocked deliverable snapshot for: {url}"
            
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "GenLayer-GenVM-Validator/1.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                content = response.read().decode('utf-8', errors='ignore')
                # Basic tag stripping
                import re
                clean_text = re.sub(r'<[^>]+>', ' ', content)
                clean_text = re.sub(r'\s+', ' ', clean_text).strip()
                return clean_text[:4000]
        except Exception as e:
            return f"[GenVM Web Reader Notice: Could not load URL '{url}' ({str(e)}). Simulating sandbox payload.]"

class GenVMLLMClient:
    """Simulates GenVM non-deterministic LLM execution (gl.nondet.exec_prompt)."""
    
    def exec_prompt(
        self,
        prompt: str,
        system_instruction: str = "",
        response_format: str = "json"
    ) -> Dict[str, Any]:
        """
        Executes reasoning prompt. Uses heuristics and pattern analysis
        to produce realistic deterministic and subjective outputs.
        """
        prompt_lower = prompt.lower()
        
        # Check if this is an Escrow milestone evaluation
        if "milestone title" in prompt_lower or "acceptance criteria" in prompt_lower:
            # Check for negative clues or incomplete notices
            is_incomplete = any(w in prompt_lower for w in ["missing", "buggy", "broken", "failed test", "incomplete", "todo", "hacky"])
            
            if is_incomplete:
                return {
                    "verdict": "REJECTED",
                    "score": 45,
                    "criteria_evaluation": [
                        {"criterion": "Functional requirements", "passed": False, "feedback": "Code contains unresolved syntax or missing features"},
                        {"criterion": "Test coverage", "passed": False, "feedback": "Unit tests failing or absent"},
                        {"criterion": "Design specs", "passed": True, "feedback": "Basic layout drafted"}
                    ],
                    "summary_reasoning": "Validator review revealed unfinished milestone components and failing test benchmarks. Revision required before fund disbursement.",
                    "suggested_improvements": [
                        "Complete the missing API integration endpoints",
                        "Ensure test suite passes with at least 80% code coverage",
                        "Address unhandled exceptions in the main workflow"
                    ]
                }
            else:
                return {
                    "verdict": "APPROVED",
                    "score": 92,
                    "criteria_evaluation": [
                        {"criterion": "Functional requirements fulfilled", "passed": True, "feedback": "All core modules match the milestone specification"},
                        {"criterion": "Code quality & architecture", "passed": True, "feedback": "Clean modular structure with comprehensive documentation"},
                        {"criterion": "Security & edge cases", "passed": True, "feedback": "Proper input validation and defensive checks in place"},
                        {"criterion": "Acceptance criteria adherence", "passed": True, "feedback": "Deliverable satisfies all agreed milestones"}
                    ],
                    "summary_reasoning": "Comprehensive evaluation of submitted code, tests, and documentation shows complete fulfillment of milestone specifications. High quality standard achieved.",
                    "suggested_improvements": [
                        "Add performance benchmark metrics in subsequent milestones",
                        "Include user documentation walkthrough"
                    ]
                }

        # Check if this is a Prediction / Fact Oracle check
        if "question to verify" in prompt_lower or "resolution criteria" in prompt_lower:
            # Check if affirmative or negative
            is_no = any(w in prompt_lower for w in ["delayed", "cancelled", "false", "did not", "failed to launch", "rejected"])
            outcome = "NO" if is_no else "YES"
            confidence = 94 if is_no else 98
            
            return {
                "outcome": outcome,
                "confidence_score": confidence,
                "key_facts": [
                    "Multi-source web analysis performed across authoritative news and chain data",
                    f"Verifiable primary source evidence established outcome as {outcome}",
                    "Temporal threshold verified against official recorded timestamps"
                ],
                "synthesis_summary": f"GenVM Equivalence Validators reached consensus on outcome '{outcome}' with {confidence}% confidence score after cross-referencing live data streams."
            }

        # Fallback default JSON
        return {
            "verdict": "APPROVED",
            "score": 85,
            "summary_reasoning": "Standard verification analysis completed successfully."
        }

class GenLayerRuntime:
    """
    GenLayer Runtime Simulator implementing Optimistic Democracy and Equivalence Principle.
    Simulates committee selection of 5 GenLayer validator nodes, non-deterministic execution,
    and consensus validation.
    """
    
    def __init__(self):
        self.web_client = GenVMWebClient()
        self.llm_client = GenVMLLMClient()
        self.validators = [
            {"id": "val-01-alpha", "address": "0x71C...B489", "stake": 50000, "status": "ACTIVE"},
            {"id": "val-02-beta", "address": "0x39A...F921", "stake": 42000, "status": "ACTIVE"},
            {"id": "val-03-gamma", "address": "0x82E...113C", "stake": 38000, "status": "ACTIVE"},
            {"id": "val-04-delta", "address": "0x9BF...8802", "stake": 35000, "status": "ACTIVE"},
            {"id": "val-05-omega", "address": "0x4AC...EE51", "stake": 29000, "status": "ACTIVE"},
        ]
        self.tx_history = []

    def run_equivalence_principle(self, fn: Callable, task_description: str) -> Dict[str, Any]:
        """
        Executes a non-deterministic function through the Equivalence Principle consensus protocol.
        1. Leader validator executes `fn(web, llm)`.
        2. Output is evaluated.
        3. 4 other committee validators verify and cast votes.
        """
        # Leader node execution
        leader_output = fn(self.web_client, self.llm_client)
        
        # Validator committee consensus voting
        votes = []
        for val in self.validators:
            votes.append({
                "validator": val["id"],
                "address": val["address"],
                "vote": "AGREE",
                "signature": f"0x{os.urandom(32).hex()}",
                "timestamp": int(time.time())
            })
            
        result = dict(leader_output)
        result["validators_agreed"] = len(votes)
        result["total_validators"] = len(self.validators)
        result["validator_votes"] = votes
        result["consensus_status"] = "EQUIVALENCE_PROVEN"
        result["gas_used"] = 42810
        
        # Log to runtime history
        self.tx_history.append({
            "task": task_description,
            "timestamp": int(time.time()),
            "result_summary": result.get("verdict") or result.get("outcome"),
            "validators_count": len(votes)
        })
        
        return result
