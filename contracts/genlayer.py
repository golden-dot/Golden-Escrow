"""
genlayer.py - Py-GenLayer Smart Contract SDK Stub & Mock Harness
Provides types, decorators, and runtime context for Py-GenLayer contracts.
Enables execution both inside GenVM and in standard Python environments.
"""

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional, TypeVar, Generic, Union

# Helper for allow_storage decorator
def allow_storage(cls):
    return cls

K = TypeVar('K')
V = TypeVar('V')

class u256(int):
    """256-bit unsigned integer abstraction."""
    def __new__(cls, value=0):
        val = int(value)
        if val < 0:
            raise ValueError(f"u256 cannot be negative: {val}")
        if val > 2**256 - 1:
            raise ValueError(f"u256 overflow: {val}")
        return super().__new__(cls, val)

class Address(str):
    """Ethereum / GenLayer 20-byte address abstraction."""
    def __new__(cls, val="0x0000000000000000000000000000000000000000"):
        if not isinstance(val, str):
            val = str(val)
        if not val.startswith("0x"):
            val = "0x" + val
        val_lower = val.lower()
        if len(val_lower) != 42 or not re.match(r"^0x[0-9a-f]{40}$", val_lower):
            # Normalization fallback
            padded = val_lower[2:].zfill(40)[:40]
            val_lower = "0x" + padded
        return super().__new__(cls, val_lower)

class TreeMap(dict, Generic[K, V]):
    """Py-GenLayer TreeMap storage data structure."""
    def __getitem__(self, key):
        key_str = str(key)
        return super().__getitem__(key_str)
    
    def __setitem__(self, key, value):
        key_str = str(key)
        super().__setitem__(key_str, value)

    def __contains__(self, key):
        return super().__contains__(str(key))

class MessageContext:
    def __init__(self, sender: str = "0x0000000000000000000000000000000000000000", value: int = 0):
        self.sender_address = Address(sender)
        self.value = u256(value)

class NonDetContext:
    def exec_prompt(self, prompt: str, system_instruction: str = "", response_format: str = "json") -> Dict[str, Any]:
        """
        Default non-deterministic LLM execution mock for contract unit testing.
        Analyzes prompt contents for criteria evaluation or oracle verification.
        """
        prompt_lower = prompt.lower()

        # Simple prompt-injection defense check in unit testing
        if "ignore all previous instructions" in prompt_lower or "override system policy" in prompt_lower:
            return {"decision": "REJECT", "score": 0, "criteria_results": ["Failed due to prompt injection attempt"]}

        # Check for Escrow evaluation
        if "acceptance criteria" in prompt_lower or "requirements" in prompt_lower or "task specification" in prompt_lower:
            is_failing = any(w in prompt_lower for w in ["incomplete code", "buggy", "failed test", "unresolved", "prompt injection"])
            if is_failing:
                return {
                    "decision": "REJECT",
                    "score": 40,
                    "criteria_results": ["Milestone requirements incomplete or failing test checks"],
                    "failed_criteria": ["Test suite coverage requirement not met"],
                    "evidence_summary": "Evaluated deliverable snapshot. Incomplete features identified."
                }
            return {
                "decision": "ACCEPT",
                "score": 92,
                "criteria_results": ["All milestone acceptance criteria satisfied"],
                "failed_criteria": [],
                "evidence_summary": "Evaluated deliverable snapshot. All criteria fulfilled."
            }

        # Oracle evaluation
        if any(k in prompt_lower for k in ["question", "verified data sources", "market question", "resolution criteria"]):
            is_no = any(w in prompt_lower for w in ["failed to launch", "event cancelled", "outcome: no", "was false", "rejected by committee"])
            return {"outcome": "NO" if is_no else "YES", "confidence": 95, "confidence_score": 95}

        return {"decision": "ACCEPT", "score": 90}

    def web_render(self, url: str) -> str:
        return f"Sanitized web content snapshot for URL: {url}"

class VMContext:
    def run_nondet_unsafe(self, leader_fn: Callable, validator_fn: Callable) -> Dict[str, Any]:
        """Simulates GenVM nondet execution & consensus validation."""
        leader_res = leader_fn()
        
        class LeaderWrapper:
            def __init__(self, data):
                self.calldata = data

        is_valid = validator_fn(LeaderWrapper(leader_res))
        if is_valid is False:
            raise Exception("GenVM Consensus Validation Failed: Validator disagreement")
            
        return leader_res

class PublicDecorator:
    def write(self, fn):
        fn.is_write = True
        return fn

    def view(self, fn):
        fn.is_view = True
        return fn

class Contract:
    """Base class for GenLayer Intelligent Contracts."""
    pass

class GenLayerEnvironment:
    def __init__(self):
        self.message = MessageContext()
        self.nondet = NonDetContext()
        self.vm = VMContext()
        self.public = PublicDecorator()
        self.Contract = Contract

    def set_message_sender(self, sender: str, value: int = 0):
        self.message = MessageContext(sender, value)

gl = GenLayerEnvironment()

__all__ = [
    "gl",
    "Address",
    "u256",
    "TreeMap",
    "allow_storage",
    "MessageContext",
    "NonDetContext",
    "VMContext",
    "Contract"
]
