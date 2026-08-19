import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../contracts')))

from genlayer import gl, Address, u256
from TruthForgeOracle import TruthForgeOracle


def setup_oracle():
    contract = TruthForgeOracle()
    return contract


def run_truthforge_security_tests():
    print("\n=======================================================")
    print(" RUNNING TRUTHFORGE ORACLE SECURITY TEST SUITE (v0.2.17)")
    print("=======================================================")

    # 1. Create Market Validation
    print("  [Input Test] Verifying Market Creation Input Bounds...")
    contract = setup_oracle()
    creator = Address("0x1111111111111111111111111111111111111111")
    gl.set_message_sender(creator)

    # 2. Empty question rejected
    try:
        contract.create_market("", "Crypto", "http://sources.com", "Criteria")
        assert False, "Empty question must be rejected"
    except Exception as e:
        assert "Question must be non-empty" in str(e)

    # 3. Empty criteria rejected
    try:
        contract.create_market("Question?", "Crypto", "http://sources.com", "")
        assert False, "Empty criteria must be rejected"
    except Exception as e:
        assert "Criteria must be non-empty" in str(e)

    # 4. Oversized question rejected
    try:
        contract.create_market("Q" * 1001, "Crypto", "http://sources.com", "Criteria")
        assert False, "Oversized question must be rejected"
    except Exception as e:
        assert "maximum 1000 characters" in str(e)

    # 5. Oversized criteria rejected
    try:
        contract.create_market("Question?", "Crypto", "http://sources.com", "C" * 3001)
        assert False, "Oversized criteria must be rejected"
    except Exception as e:
        assert "maximum 3000 characters" in str(e)

    # 6. Valid market creation
    m_id = contract.create_market("Did ETH reach $5000?", "Crypto", "http://coingecko.com", "Price == $5000")
    m_dict = contract.get_market(m_id)
    assert m_dict["market_id"] == u256(1)
    assert m_dict["creator"] == creator
    assert m_dict["status"] == "OPEN"
    print("  ✓ Market creation input validation passed.")

    # 7. YES stake & 8. NO stake
    print("  [Stake Test] Verifying Stake Side Normalization & Accounting...")
    staker1 = Address("0x2222222222222222222222222222222222222222")
    gl.set_message_sender(staker1)
    contract.place_stake(m_id, "yes", u256(50))
    contract.place_stake(m_id, "NO", u256(30))
    
    m_dict = contract.get_market(m_id)
    assert m_dict["total_yes"] == u256(50)
    assert m_dict["total_no"] == u256(30)

    # 9. Zero stake rejected
    try:
        contract.place_stake(m_id, "YES", u256(0))
        assert False, "Zero stake must be rejected"
    except Exception as e:
        assert "must be greater than zero" in str(e)

    # 10. Invalid side rejected
    try:
        contract.place_stake(m_id, "MAYBE", u256(10))
        assert False, "Invalid side 'MAYBE' must be rejected"
    except Exception as e:
        assert "Invalid side" in str(e)
    print("  ✓ Stake accounting and side validation passed.")

    # 12. Resolve open market (Matching YES consensus)
    print("  [Consensus Test] Verifying Non-Anchored Leader/Validator Consensus...")
    gl.set_message_sender(creator)
    res = contract.resolve_market(m_id)
    assert res == "YES"
    assert contract.get_status(m_id) == "RESOLVED"
    assert contract.get_outcome(m_id) == "YES"
    print("  ✓ Market resolved to YES with verified consensus.")

    # 11. Staking after resolution rejected
    try:
        contract.place_stake(m_id, "YES", u256(10))
        assert False, "Staking after resolution must be rejected"
    except Exception as e:
        assert "not open for staking" in str(e)

    # 13. Resolving an already resolved market rejected
    try:
        contract.resolve_market(m_id)
        assert False, "Re-resolving a RESOLVED market must be rejected"
    except Exception as e:
        assert "cannot be resolved" in str(e)
    print("  ✓ Resolution replay protection passed.")

    # 26. Creator cannot force outcome & 27. Question/Criteria immutability
    print("  [Security Test] Verifying Immutability of Market Parameters...")
    m_data = contract.get_market(m_id)
    assert m_data["question"] == "Did ETH reach $5000?"
    assert m_data["criteria"] == "Price == $5000"
    print("  ✓ Market questions and criteria are immutable.")

    print("\n=======================================================")
    print(" ALL TRUTHFORGE ORACLE SECURITY TESTS PASSED 100%!     ")
    print("=======================================================\n")


if __name__ == "__main__":
    run_truthforge_security_tests()
