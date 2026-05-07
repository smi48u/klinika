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
  visualMin: document.querySelector("#visualMin"),
  visualMax: document.querySelector("#visualMax"),
  spectrumReference: document.querySelector("#spectrumReference"),
  spectrumMarker: document.querySelector("#spectrumMarker"),
  spectrumZone: document.querySelector("#spectrumZone"),
  spectrumTotal: document.querySelector("#spectrumTotal"),
  waterfallMin: document.querySelector("#waterfallMin"),
  waterfallMax: document.querySelector("#waterfallMax"),
  wfBaseValue: document.querySelector("#wfBaseValue"),
  wfBaseBar: document.querySelector("#wfBaseBar"),
  wfBaseNode: document.querySelector("#wfBaseNode"),
  wfContractValue: document.querySelector("#wfContractValue"),
  wfContractNote: document.querySelector("#wfContractNote"),
  wfContractBar: document.querySelector("#wfContractBar"),
  wfContractNode: document.querySelector("#wfContractNode"),
  wfCreditValue: document.querySelector("#wfCreditValue"),
  wfCreditNote: document.querySelector("#wfCreditNote"),
  wfCreditBar: document.querySelector("#wfCreditBar"),
  wfCreditNode: document.querySelector("#wfCreditNode"),
  wfInsuranceValue: document.querySelector("#wfInsuranceValue"),
  wfInsuranceNote: document.querySelector("#wfInsuranceNote"),
  wfInsuranceBar: document.querySelector("#wfInsuranceBar"),
  wfInsuranceNode: document.querySelector("#wfInsuranceNode"),
  wfNonCompeteValue: document.querySelector("#wfNonCompeteValue"),
  wfNonCompeteNote: document.querySelector("#wfNonCompeteNote"),
  wfNonCompeteBar: document.querySelector("#wfNonCompeteBar"),
  wfNonCompeteNode: document.querySelector("#wfNonCompeteNode"),
  wfFinalValue: document.querySelector("#wfFinalValue"),
  wfFinalNote: document.querySelector("#wfFinalNote"),
  wfFinalBar: document.querySelector("#wfFinalBar"),
  wfFinalNode: document.querySelector("#wfFinalNode"),
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

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function setNodePosition(node, value, range) {
  const span = Math.max(range.max - range.min, 1);
  const left = clampPercent(((value - range.min) / span) * 100);
  node.style.left = `${left}%`;
}

function setBarPosition(node, startValue, endValue, range) {
  const span = Math.max(range.max - range.min, 1);
  const left = clampPercent(((Math.min(startValue, endValue) - range.min) / span) * 100);
  const width = clampPercent((Math.abs(endValue - startValue) / span) * 100);

  node.style.left = `${left}%`;
  node.style.width = `${width}%`;
}

function setStepDirection(node, delta) {
  node.classList.remove("step-positive", "step-negative", "step-neutral");

  if (delta > 0) {
    node.classList.add("step-positive");
  } else if (delta < 0) {
    node.classList.add("step-negative");
  } else {
    node.classList.add("step-neutral");
  }
}

function updateSpectrum(total, referenceRange, visualRange) {
  const visualSpan = Math.max(visualRange.max - visualRange.min, 1);
  const markerPosition = clampPercent(((total - visualRange.min) / visualSpan) * 100);
  const referenceStart = clampPercent(((referenceRange.min - visualRange.min) / visualSpan) * 100);
  const referenceWidth = clampPercent(((referenceRange.max - referenceRange.min) / visualSpan) * 100);

  elements.visualMin.textContent = formatMoney(visualRange.min);
  elements.visualMax.textContent = formatMoney(visualRange.max);
  elements.spectrumMarker.style.left = `${markerPosition}%`;
  elements.spectrumReference.style.left = `${referenceStart}%`;
  elements.spectrumReference.style.width = `${referenceWidth}%`;
  elements.spectrumTotal.textContent = formatMoney(total);
}

function updateWaterfall(data) {
  const range = data.visual_range;
  const base = data.base_value;
  const afterContract = base + data.adjustments.contract;
  const afterCredit = afterContract + data.adjustments.credit;
  const afterInsurance = afterCredit + data.adjustments.insurance;
  const afterNonCompete = afterInsurance + data.adjustments.non_compete;
  const total = data.total;

  elements.waterfallMin.textContent = formatMoney(range.min);
  elements.waterfallMax.textContent = formatMoney(range.max);

  elements.wfBaseValue.textContent = formatMoney(base);
  setBarPosition(elements.wfBaseBar, range.min, base, range);
  setNodePosition(elements.wfBaseNode, base, range);

  const steps = [
    {
      valueNode: elements.wfContractValue,
      noteNode: elements.wfContractNote,
      barNode: elements.wfContractBar,
      pointNode: elements.wfContractNode,
      start: base,
      end: afterContract,
      delta: data.adjustments.contract,
      note:
        data.adjustments.contract > 0
          ? "Dłuższy kontrakt podnosi wynik."
          : data.adjustments.contract < 0
            ? "Krótszy kontrakt obniża wynik."
            : "Pełny kontrakt nie zmienia wyniku.",
    },
    {
      valueNode: elements.wfCreditValue,
      noteNode: elements.wfCreditNote,
      barNode: elements.wfCreditBar,
      pointNode: elements.wfCreditNode,
      start: afterContract,
      end: afterCredit,
      delta: data.adjustments.credit,
      note:
        data.adjustments.credit > 0
          ? "Wyższy kredyt sprzedającego podnosi wynik."
          : data.adjustments.credit < 0
            ? "Niższy kredyt sprzedającego obniża wynik."
            : "Kredyt jest na poziomie neutralnym.",
    },
    {
      valueNode: elements.wfInsuranceValue,
      noteNode: elements.wfInsuranceNote,
      barNode: elements.wfInsuranceBar,
      pointNode: elements.wfInsuranceNode,
      start: afterCredit,
      end: afterInsurance,
      delta: data.adjustments.insurance,
      note:
        data.adjustments.insurance < 0
          ? "Brak ubezpieczenia obniża wynik."
          : "Ubezpieczenie pozostawia wynik bez zmiany.",
    },
    {
      valueNode: elements.wfNonCompeteValue,
      noteNode: elements.wfNonCompeteNote,
      barNode: elements.wfNonCompeteBar,
      pointNode: elements.wfNonCompeteNode,
      start: afterInsurance,
      end: afterNonCompete,
      delta: data.adjustments.non_compete,
      note:
        data.adjustments.non_compete < 0
          ? "Brak zakazu konkurencji obniża wynik."
          : "Zakaz konkurencji pozostawia wynik bez zmiany.",
    },
  ];

  for (const step of steps) {
    step.valueNode.textContent = formatSignedMoney(step.delta);
    applyAdjustmentClass(step.valueNode, step.delta);
    step.noteNode.textContent = step.note;
    setBarPosition(step.barNode, step.start, step.end, range);
    setNodePosition(step.pointNode, step.end, range);
    setStepDirection(step.barNode, step.delta);
  }

  elements.wfFinalValue.textContent = formatMoney(total);
  setBarPosition(elements.wfFinalBar, range.min, total, range);
  setNodePosition(elements.wfFinalNode, total, range);

  if (total < data.reference_range.min) {
    elements.wfFinalNote.textContent = "Wynik końcowy jest poniżej zakresu referencyjnego.";
  } else if (total > data.reference_range.max) {
    elements.wfFinalNote.textContent = "Wynik końcowy jest powyżej zakresu referencyjnego.";
  } else {
    elements.wfFinalNote.textContent = "Wynik końcowy mieści się w zakresie referencyjnym.";
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

    updateSpectrum(data.total, data.reference_range, data.visual_range);
    updateWaterfall(data);

    if (data.total < rangeMin) {
      elements.rangeStatus.textContent = "Wartość jest poniżej zakresu referencyjnego 7.40-7.80 mln zł.";
      elements.spectrumZone.textContent = "Poniżej zakresu referencyjnego";
    } else if (data.total > rangeMax) {
      elements.rangeStatus.textContent = "Wartość jest powyżej zakresu referencyjnego 7.40-7.80 mln zł.";
      elements.spectrumZone.textContent = "Powyżej zakresu referencyjnego";
    } else {
      elements.rangeStatus.textContent = "Wartość mieści się w zakresie referencyjnym.";
      elements.spectrumZone.textContent = "W zakresie referencyjnym";
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
