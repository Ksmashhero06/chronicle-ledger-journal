"""
Unit tests for the safe AST rule parser and Rule Test Lab.
"""

import pytest
from backend.engine.rule_parser import parse_rule, evaluate_node, run_rule_test_lab


def test_simple_numeric_comparison():
    ast = parse_rule("accuracy >= 90")
    res, expl = evaluate_node(ast, {"accuracy": 92.4})
    assert res is True
    assert "TRUE" in expl

    res_fail, expl_fail = evaluate_node(ast, {"accuracy": 72.1})
    assert res_fail is False
    assert "FALSE" in expl_fail


def test_missing_variable_returns_insufficient():
    ast = parse_rule("accuracy >= 90")
    res, expl = evaluate_node(ast, {})
    assert res is None  # Insufficient
    assert "not found" in expl


def test_compound_and_boolean():
    ast = parse_rule("public_url_exists == true AND host == 'aws'")
    # Both true
    res, _ = evaluate_node(ast, {"public_url_exists": True, "host": "aws"})
    assert res is True

    # One false
    res2, _ = evaluate_node(ast, {"public_url_exists": True, "host": "gcp"})
    assert res2 is False

    # One missing
    res3, _ = evaluate_node(ast, {"public_url_exists": True})
    assert res3 is None


def test_compound_or():
    ast = parse_rule("license == 'MIT' OR license == 'Apache-2.0'")
    res1, _ = evaluate_node(ast, {"license": "MIT"})
    assert res1 is True

    res2, _ = evaluate_node(ast, {"license": "GPL-3.0"})
    assert res2 is False


def test_not_operator():
    ast = parse_rule("NOT origin_fork == true")
    res, _ = evaluate_node(ast, {"origin_fork": False})
    assert res is True

    res2, _ = evaluate_node(ast, {"origin_fork": True})
    assert res2 is False


def test_rule_test_lab():
    expr = "accuracy >= 90"
    test_cases = [
        {"name": "Pass Case", "inputs": {"accuracy": 95}, "expected": "TRUE"},
        {"name": "Fail Case", "inputs": {"accuracy": 72}, "expected": "FALSE"},
        {"name": "Insufficient Case", "inputs": {}, "expected": "INSUFFICIENT"},
    ]
    results = run_rule_test_lab(expr, test_cases)
    assert len(results) == 3
    assert all(r["passed"] for r in results)


def test_rejects_arbitrary_python_code():
    with pytest.raises(ValueError):
        parse_rule("__import__('os').system('echo pwned')")
