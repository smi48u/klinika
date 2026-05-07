const elements = {
  contractMonths: document.querySelector("#contractMonths"),
  sellerCredit: document.querySelector("#sellerCredit"),
  hasInsurance: document.querySelector("#hasInsurance"),
  hasNonCompete: document.querySelector("#hasNonCompete"),
  contractMonthsValue: document.querySelector("#contractMonthsValue"),
  sellerCreditValue: document.querySelector("#sellerCreditValue"),
  contractHint: document.querySelector("#contractHint"),
  totalValue: document.querySelector("#totalValue"),
  rangeStatus: document.querySelector("#rangeStatus"),
  baseValue: document.querySelector("#baseValue"),
  contractAdjustment: document.querySelector("#contractAdjustment"),
  creditAdjustment: document.querySelector("#creditAdjustment"),
  insuranceAdjustment: document.querySelector("#insuranceAdjustment"),
  nonCompeteAdjustment: document.querySelector("#nonCompeteAdjustment"),
};

function formatMoney(value) {
  return `${(value / 1_000_000).toFixed(2)} mln zł`;
}

function formatSignedMoney(value) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatMoney(value)}`;
}

function applyAdjustmentClass(node, value) {
  node.classList.remove("positive", "negative");

  if (value > 0) {
    node.classList.add("positive");
  } else if (value < 0) {
    node.classList.add("negative");
  }
}

async function updateCalculation() {
  const payload = {
    contract_months: Number(elements.contractMonths.value),
    seller_credit: Number(elements.sellerCredit.value),
    has_insurance: elements.hasInsurance.checked,
    has_non_compete: elements.hasNonCompete.checked,
  };

  elements.contractMonthsValue.textContent = `${payload.contract_months} mies.`;
  elements.sellerCreditValue.textContent = formatMoney(payload.seller_credit);

  try {
    const response = await fetch("/api/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const contractComponent = formatMoney(data.contract_component);
    const rangeMin = data.reference_range.min;
    const rangeMax = data.reference_range.max;

    elements.contractHint.textContent = `Aktualna wartość kontraktu: ${contractComponent} z maksymalnych 2.00 mln zł.`;
    elements.totalValue.textContent = formatMoney(data.total);
    elements.baseValue.textContent = formatMoney(data.base_value);

    const rows = [
      [elements.contractAdjustment, data.adjustments.contract],
      [elements.creditAdjustment, data.adjustments.credit],
      [elements.insuranceAdjustment, data.adjustments.insurance],
      [elements.nonCompeteAdjustment, data.adjustments.non_compete],
    ];

    for (const [node, value] of rows) {
      node.textContent = formatSignedMoney(value);
      applyAdjustmentClass(node, value);
    }

    if (data.total < rangeMin) {
      elements.rangeStatus.textContent = "Wartość jest poniżej zakresu referencyjnego 7.40-7.80 mln zł.";
    } else if (data.total > rangeMax) {
      elements.rangeStatus.textContent = "Wartość jest powyżej zakresu referencyjnego 7.40-7.80 mln zł.";
    } else {
      elements.rangeStatus.textContent = "Wartość mieści się w zakresie referencyjnym.";
    }
  } catch (error) {
    elements.rangeStatus.textContent = "Nie udało się przeliczyć wyniku.";
  }
}

for (const node of [
  elements.contractMonths,
  elements.sellerCredit,
  elements.hasInsurance,
  elements.hasNonCompete,
]) {
  node.addEventListener("input", updateCalculation);
  node.addEventListener("change", updateCalculation);
}

updateCalculation();
