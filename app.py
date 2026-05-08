from __future__ import annotations

from dataclasses import dataclass

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

BASE_VALUE = 7_400_000
MAX_CONTRACT_VALUE = 2_000_000
MAX_CONTRACT_MONTHS = 36
MIN_BASE_VALUE = 0
MAX_BASE_VALUE = 20_000_000
MIN_SELLER_CREDIT = 1_800_000
MAX_SELLER_CREDIT = 3_000_000
NEUTRAL_SELLER_CREDIT = 2_000_000
SELLER_CREDIT_WEIGHT = 0.5
INSURANCE_PENALTY = 1_000_000
NON_COMPETE_PENALTY = 500_000
REFERENCE_MIN = 7_400_000
REFERENCE_MAX = 7_800_000


@dataclass
class Scenario:
    base_value: int
    contract_months: int
    seller_credit: int
    has_insurance: bool
    has_non_compete: bool


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def calculate_visual_range(base_value: int) -> dict[str, int]:
    credit_min_adjustment = round((MIN_SELLER_CREDIT - NEUTRAL_SELLER_CREDIT) * SELLER_CREDIT_WEIGHT)
    credit_max_adjustment = round((MAX_SELLER_CREDIT - NEUTRAL_SELLER_CREDIT) * SELLER_CREDIT_WEIGHT)

    return {
        "min": (
            base_value
            - MAX_CONTRACT_VALUE
            + credit_min_adjustment
            - INSURANCE_PENALTY
            - NON_COMPETE_PENALTY
        ),
        "max": base_value + credit_max_adjustment,
    }


def calculate_transaction(scenario: Scenario) -> dict[str, object]:
    base_value = int(clamp(scenario.base_value, MIN_BASE_VALUE, MAX_BASE_VALUE))
    contract_months = int(clamp(scenario.contract_months, 0, MAX_CONTRACT_MONTHS))
    seller_credit = int(clamp(scenario.seller_credit, MIN_SELLER_CREDIT, MAX_SELLER_CREDIT))

    contract_component = round(MAX_CONTRACT_VALUE * (contract_months / MAX_CONTRACT_MONTHS))
    contract_adjustment = contract_component - MAX_CONTRACT_VALUE
    credit_adjustment = round((seller_credit - NEUTRAL_SELLER_CREDIT) * SELLER_CREDIT_WEIGHT)
    insurance_adjustment = 0 if scenario.has_insurance else -INSURANCE_PENALTY
    non_compete_adjustment = 0 if scenario.has_non_compete else -NON_COMPETE_PENALTY

    adjustments = {
        "contract": contract_adjustment,
        "credit": credit_adjustment,
        "insurance": insurance_adjustment,
        "non_compete": non_compete_adjustment,
    }

    total = base_value + sum(adjustments.values())
    visual_range = calculate_visual_range(base_value)

    return {
        "base_value": base_value,
        "total": total,
        "contract_component": contract_component,
        "reference_range": {
            "min": REFERENCE_MIN,
            "max": REFERENCE_MAX,
        },
        "visual_range": visual_range,
        "adjustments": adjustments,
    }


@app.get("/")
def index() -> str:
    return render_template("index.html")


@app.post("/api/calculate")
def calculate() -> tuple[object, int]:
    payload = request.get_json(silent=True) or {}

    scenario = Scenario(
        base_value=int(payload.get("base_value", BASE_VALUE)),
        contract_months=int(payload.get("contract_months", 36)),
        seller_credit=int(payload.get("seller_credit", 2_000_000)),
        has_insurance=bool(payload.get("has_insurance", True)),
        has_non_compete=bool(payload.get("has_non_compete", True)),
    )

    result = calculate_transaction(scenario)
    return jsonify(result), 200


if __name__ == "__main__":
    app.run(debug=True)
