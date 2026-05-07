from __future__ import annotations

from dataclasses import dataclass

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

BASE_VALUE = 7_400_000
MAX_CONTRACT_VALUE = 2_000_000
MAX_CONTRACT_MONTHS = 36
NEUTRAL_SELLER_CREDIT = 2_000_000
INSURANCE_PENALTY = 1_000_000
NON_COMPETE_PENALTY = 500_000


@dataclass
class Scenario:
    contract_months: int
    seller_credit: int
    has_insurance: bool
    has_non_compete: bool


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def calculate_transaction(scenario: Scenario) -> dict[str, object]:
    contract_months = int(clamp(scenario.contract_months, 0, MAX_CONTRACT_MONTHS))
    seller_credit = int(clamp(scenario.seller_credit, 1_800_000, 3_000_000))

    contract_component = round(MAX_CONTRACT_VALUE * (contract_months / MAX_CONTRACT_MONTHS))
    contract_adjustment = contract_component - MAX_CONTRACT_VALUE
    credit_adjustment = seller_credit - NEUTRAL_SELLER_CREDIT
    insurance_adjustment = 0 if scenario.has_insurance else -INSURANCE_PENALTY
    non_compete_adjustment = 0 if scenario.has_non_compete else -NON_COMPETE_PENALTY

    adjustments = {
        "contract": contract_adjustment,
        "credit": credit_adjustment,
        "insurance": insurance_adjustment,
        "non_compete": non_compete_adjustment,
    }

    total = BASE_VALUE + sum(adjustments.values())

    return {
        "base_value": BASE_VALUE,
        "total": total,
        "contract_component": contract_component,
        "reference_range": {
            "min": 7_400_000,
            "max": 7_800_000,
        },
        "adjustments": adjustments,
    }


@app.get("/")
def index() -> str:
    return render_template("index.html")


@app.post("/api/calculate")
def calculate() -> tuple[object, int]:
    payload = request.get_json(silent=True) or {}

    scenario = Scenario(
        contract_months=int(payload.get("contract_months", 36)),
        seller_credit=int(payload.get("seller_credit", 2_000_000)),
        has_insurance=bool(payload.get("has_insurance", True)),
        has_non_compete=bool(payload.get("has_non_compete", True)),
    )

    result = calculate_transaction(scenario)
    return jsonify(result), 200


if __name__ == "__main__":
    app.run(debug=True)
