"""
Chronicle Ledger v2 - Safe Rule Parser & AST Engine
Defines a restricted rule syntax for deterministic verification without using eval().
Supported syntax:
- Identifiers: variable names (e.g., accuracy, public_url_exists)
- Relational operators: ==, !=, <, <=, >, >=
- Logical operators: AND, OR, NOT
- Literals: numbers (int/float), booleans (true/false), quoted strings ("MIT", 'AWS')
- Parentheses: ( ) for grouping
"""

import re
from typing import Any, Dict, List, Optional, Tuple, Union


class ASTNode:
    """Base class for AST nodes."""
    pass


class LiteralNode(ASTNode):
    def __init__(self, value: Any):
        self.value = value

    def __repr__(self):
        return f"Literal({self.value!r})"


class IdentifierNode(ASTNode):
    def __init__(self, name: str):
        self.name = name

    def __repr__(self):
        return f"Identifier({self.name})"


class CompareNode(ASTNode):
    def __init__(self, left: str, op: str, right: Any):
        self.left = left.strip()
        self.op = op.strip()
        self.right = right

    def __repr__(self):
        return f"Compare({self.left} {self.op} {self.right!r})"


class BoolOpNode(ASTNode):
    def __init__(self, op: str, left: ASTNode, right: ASTNode):
        self.op = op.upper()  # 'AND' or 'OR'
        self.left = left
        self.right = right

    def __repr__(self):
        return f"({self.left} {self.op} {self.right})"


class NotNode(ASTNode):
    def __init__(self, operand: ASTNode):
        self.operand = operand

    def __repr__(self):
        return f"NOT({self.operand})"


# --- Tokenizer ---

TOKEN_SPEC = [
    ("NUMBER", r"-?\d+(?:\.\d+)?"),
    ("STRING", r"\"[^\"]*\"|'[^']*'"),
    ("BOOL", r"\b(?:true|false|True|False)\b"),
    ("NULL", r"\b(?:null|none|None)\b"),
    ("AND", r"\b(?:AND|and|&&)\b"),
    ("OR", r"\b(?:OR|or|\|\|)\b"),
    ("NOT", r"\b(?:NOT|not|!)\b"),
    ("OP", r"==|!=|<=|>=|<|>"),
    ("LPAREN", r"\("),
    ("RPAREN", r"\)"),
    ("IDENTIFIER", r"[a-zA-Z_][a-zA-Z0-9_]*"),
    ("SKIP", r"[ \t\r\n]+"),
    ("MISMATCH", r"."),
]

TOKEN_REGEX = "|".join(f"(?P<{pair[0]}>{pair[1]})" for pair in TOKEN_SPEC)


def tokenize(expression: str) -> List[Tuple[str, str]]:
    tokens = []
    for mo in re.finditer(TOKEN_REGEX, expression):
        kind = mo.lastgroup
        value = mo.group()
        if kind == "SKIP":
            continue
        elif kind == "MISMATCH":
            raise ValueError(f"Unexpected character in rule expression: {value!r}")
        tokens.append((kind, value))
    return tokens


# --- Parser ---

class RuleParser:
    """Recursive descent parser for the custom rule language."""

    def __init__(self, tokens: List[Tuple[str, str]]):
        self.tokens = tokens
        self.pos = 0

    def peek(self) -> Optional[Tuple[str, str]]:
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def consume(self, expected_kind: Optional[str] = None) -> Tuple[str, str]:
        if self.pos >= len(self.tokens):
            raise ValueError("Unexpected end of expression")
        tok = self.tokens[self.pos]
        if expected_kind and tok[0] != expected_kind:
            raise ValueError(f"Expected {expected_kind}, got {tok[0]} ('{tok[1]}')")
        self.pos += 1
        return tok

    def parse(self) -> ASTNode:
        node = self.parse_or()
        if self.pos < len(self.tokens):
            extra = self.tokens[self.pos:]
            raise ValueError(f"Unparsed trailing tokens: {extra}")
        return node

    def parse_or(self) -> ASTNode:
        node = self.parse_and()
        while True:
            tok = self.peek()
            if tok and tok[0] == "OR":
                self.consume("OR")
                right = self.parse_and()
                node = BoolOpNode("OR", node, right)
            else:
                break
        return node

    def parse_and(self) -> ASTNode:
        node = self.parse_not()
        while True:
            tok = self.peek()
            if tok and tok[0] == "AND":
                self.consume("AND")
                right = self.parse_not()
                node = BoolOpNode("AND", node, right)
            else:
                break
        return node

    def parse_not(self) -> ASTNode:
        tok = self.peek()
        if tok and tok[0] == "NOT":
            self.consume("NOT")
            operand = self.parse_not()
            return NotNode(operand)
        return self.parse_primary()

    def parse_primary(self) -> ASTNode:
        tok = self.peek()
        if not tok:
            raise ValueError("Unexpected end of expression")

        # Parenthesized expression
        if tok[0] == "LPAREN":
            self.consume("LPAREN")
            node = self.parse_or()
            self.consume("RPAREN")
            return node

        # Comparison: IDENTIFIER OP LITERAL
        if tok[0] == "IDENTIFIER":
            ident_tok = self.consume("IDENTIFIER")
            next_tok = self.peek()
            if next_tok and next_tok[0] == "OP":
                op_tok = self.consume("OP")
                lit_tok = self.consume()
                lit_val = self._parse_literal_token(lit_tok)
                return CompareNode(ident_tok[1], op_tok[1], lit_val)
            # Boolean identifier flag alone (e.g. "public_url_exists")
            return CompareNode(ident_tok[1], "==", True)

        raise ValueError(f"Unexpected token in expression: {tok}")

    def _parse_literal_token(self, token: Tuple[str, str]) -> Any:
        kind, val = token
        if kind == "NUMBER":
            return float(val) if "." in val else int(val)
        if kind == "STRING":
            return val[1:-1]  # strip quotes
        if kind == "BOOL":
            return val.lower() == "true"
        if kind == "NULL":
            return None
        if kind == "IDENTIFIER":
            return val
        raise ValueError(f"Expected literal value, got {kind} ('{val}')")


def parse_rule(expression: str) -> ASTNode:
    """Parses a rule string into an AST without using eval()."""
    clean_expr = expression.strip()
    if not clean_expr:
        raise ValueError("Empty rule expression")
    tokens = tokenize(clean_expr)
    parser = RuleParser(tokens)
    return parser.parse()


# --- Evaluator ---

def evaluate_node(node: ASTNode, variables: Dict[str, Any]) -> Tuple[Optional[bool], str]:
    """
    Deterministically evaluates an ASTNode against a dictionary of extracted variables.
    Returns (result, explanation):
    - result: True (passed), False (failed), or None (evidence insufficient / missing variable)
    """
    if isinstance(node, CompareNode):
        var_name = node.left
        # Case-insensitive lookup helper
        lookup = {k.lower(): v for k, v in variables.items()}
        val = lookup.get(var_name.lower())

        if val is None:
            return None, f"Variable '{var_name}' not found in extracted evidence"

        op = node.op
        target = node.right

        # Boolean comparison (check before numeric coercion since bool is a subclass of int in Python)
        if isinstance(target, bool) or isinstance(val, bool):
            if isinstance(val, str):
                val_bool = val.strip().lower() in ("true", "1", "yes", "passed")
            else:
                val_bool = bool(val)

            if isinstance(target, str):
                target_bool = target.strip().lower() in ("true", "1", "yes", "passed")
            else:
                target_bool = bool(target)

            if op == "==":
                passed = (val_bool == target_bool)
            elif op == "!=":
                passed = (val_bool != target_bool)
            else:
                return False, f"Operator '{op}' is not supported for boolean values"

            explanation = f"Evaluated boolean {var_name} ({val}) {op} {target} -> {'TRUE' if passed else 'FALSE'}"
            return passed, explanation

        # Numeric coercion if comparable (guaranteed neither is bool)
        if isinstance(target, (int, float)) and isinstance(val, (int, float, str)):
            try:
                val = float(str(val).replace("%", "").replace("ms", "").replace(",", "").strip())
            except ValueError:
                return False, f"Could not parse '{val}' as number for comparison {op} {target}"

        # String case-insensitivity
        if isinstance(target, str) and isinstance(val, str):
            val_comp = val.strip().lower()
            target_comp = target.strip().lower()
        else:
            val_comp = val
            target_comp = target

        passed = False
        try:
            if op == "==":
                passed = val_comp == target_comp
            elif op == "!=":
                passed = val_comp != target_comp
            elif op == ">=":
                passed = val_comp >= target_comp
            elif op == "<=":
                passed = val_comp <= target_comp
            elif op == ">":
                passed = val_comp > target_comp
            elif op == "<":
                passed = val_comp < target_comp
            else:
                return False, f"Unsupported operator: {op}"
        except TypeError as e:
            return False, f"Type mismatch comparing {val!r} and {target!r} ({e})"

        op_str = f"{val} {op} {target}"
        explanation = f"Evaluated {op_str} -> {'TRUE' if passed else 'FALSE'}"
        return passed, explanation

    elif isinstance(node, BoolOpNode):
        left_res, left_exp = evaluate_node(node.left, variables)
        right_res, right_exp = evaluate_node(node.right, variables)

        if node.op == "AND":
            # If either is False, overall is False
            if left_res is False or right_res is False:
                return False, f"({left_exp}) AND ({right_exp}) -> FALSE"
            # If either is Insufficient (None), overall is Insufficient
            if left_res is None or right_res is None:
                return None, f"Insufficient evidence in compound AND: left={left_res}, right={right_res}"
            # Both True
            return True, f"({left_exp}) AND ({right_exp}) -> TRUE"

        elif node.op == "OR":
            # If either is True, overall is True
            if left_res is True or right_res is True:
                return True, f"({left_exp}) OR ({right_exp}) -> TRUE"
            # If both are False
            if left_res is False and right_res is False:
                return False, f"({left_exp}) OR ({right_exp}) -> FALSE"
            # Otherwise Insufficient
            return None, f"Insufficient evidence in compound OR"

    elif isinstance(node, NotNode):
        res, exp = evaluate_node(node.operand, variables)
        if res is None:
            return None, f"NOT(INSUFFICIENT) -> INSUFFICIENT"
        return (not res), f"NOT({exp}) -> {not res}"

    return None, f"Unsupported node type: {type(node)}"


# --- Rule Test Lab ---

def run_rule_test_lab(expression: str, test_cases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Executes test cases against a compiled rule expression.
    Each test case has:
    - name: str
    - inputs: Dict[str, Any]
    - expected: "TRUE" | "FALSE" | "INSUFFICIENT"
    Returns list of evaluation results with pass/fail status.
    """
    try:
        ast = parse_rule(expression)
    except Exception as e:
        return [{
            "name": "Syntax Check",
            "inputs": {},
            "expected": "COMPILED",
            "actual": f"PARSE_ERROR: {str(e)}",
            "passed": False,
        }]

    results = []
    for tc in test_cases:
        name = tc.get("name", "Unnamed Case")
        inputs = tc.get("inputs", {})
        expected = str(tc.get("expected", "TRUE")).upper()

        eval_res, explanation = evaluate_node(ast, inputs)
        if eval_res is True:
            actual = "TRUE"
        elif eval_res is False:
            actual = "FALSE"
        else:
            actual = "INSUFFICIENT"

        passed = (actual == expected)
        results.append({
            "name": name,
            "inputs": inputs,
            "expected": expected,
            "actual": actual,
            "passed": passed,
            "explanation": explanation,
        })

    return results
