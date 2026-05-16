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
  propertyAndEquipmentValue: document.querySelector("#propertyAndEquipmentValue"),
  impactFlowSvg: document.querySelector("#impactFlowSvg"),
  storyBaseCard: document.querySelector("#storyBaseCard"),
  storyBaseValue: document.querySelector("#storyBaseValue"),
  storyBaseText: document.querySelector("#storyBaseText"),
  storyContractCard: document.querySelector("#storyContractCard"),
  storyContractValue: document.querySelector("#storyContractValue"),
  storyContractText: document.querySelector("#storyContractText"),
  storyCreditCard: document.querySelector("#storyCreditCard"),
  storyCreditValue: document.querySelector("#storyCreditValue"),
  storyCreditText: document.querySelector("#storyCreditText"),
  storyInsuranceCard: document.querySelector("#storyInsuranceCard"),
  storyInsuranceValue: document.querySelector("#storyInsuranceValue"),
  storyInsuranceText: document.querySelector("#storyInsuranceText"),
  storyNonCompeteCard: document.querySelector("#storyNonCompeteCard"),
  storyNonCompeteValue: document.querySelector("#storyNonCompeteValue"),
  storyNonCompeteText: document.querySelector("#storyNonCompeteText"),
  storyFinalCard: document.querySelector("#storyFinalCard"),
  storyFinalValue: document.querySelector("#storyFinalValue"),
  storyFinalText: document.querySelector("#storyFinalText"),
};

const FLOW_WIDTH = 860;
const FLOW_HEIGHT = 190;
const FLOW_PADDING = {
  top: 18,
  right: 46,
  bottom: 30,
  left: 46,
};

const STEP_COLORS = {
  base: "#b85c38",
  contract: "#ff6a57",
  credit: "#228a57",
  insurance: "#2f69d8",
  nonCompete: "#f0a128",
  final: "#20150d",
};

function formatMoney(value) {
  return `${(value / 1_000_000).toFixed(2)} mln zł`;
}

function formatSignedMoney(value) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatMoney(value)}`;
}

function formatCompactMoney(value) {
  return `${(value / 1_000_000).toFixed(2)} mln`;
}

function formatCompactSignedMoney(value) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatCompactMoney(value)}`;
}

function applyAdjustmentClass(node, value) {
  node.classList.remove("positive", "negative");

  if (value > 0) {
    node.classList.add("positive");
  } else if (value < 0) {
    node.classList.add("negative");
  }
}

function setCardState(card, value) {
  card.classList.remove("is-positive", "is-negative", "is-neutral");

  if (value > 0) {
    card.classList.add("is-positive");
  } else if (value < 0) {
    card.classList.add("is-negative");
  } else {
    card.classList.add("is-neutral");
  }
}

function buildPillMarkup(x, y, label, kind) {
  const charWidth = kind === "point" ? 7.2 : 6.6;
  const pillWidth = Math.max(kind === "point" ? 72 : 62, label.length * charWidth + 20);
  const pillClass = kind === "point" ? "flow-point-pill" : "flow-segment-pill";
  const textClass = kind === "point" ? "flow-point-text" : "flow-segment-text";

  return `
    <g transform="translate(${x}, ${y})">
      <rect class="${pillClass}" x="${-pillWidth / 2}" y="-13" width="${pillWidth}" height="26" rx="13" ry="13"></rect>
      <text class="${textClass}" x="0" y="4" text-anchor="middle">${label}</text>
    </g>
  `;
}

function renderImpactFlow(data) {
  const referenceRange = data.reference_range;
  const plotWidth = FLOW_WIDTH - FLOW_PADDING.left - FLOW_PADDING.right;
  const plotHeight = FLOW_HEIGHT - FLOW_PADDING.top - FLOW_PADDING.bottom;

  const base = data.base_value;
  const afterContract = base + data.adjustments.contract;
  const afterCredit = afterContract + data.adjustments.credit;
  const afterInsurance = afterCredit + data.adjustments.insurance;
  const afterNonCompete = afterInsurance + data.adjustments.non_compete;
  const total = data.total;

  const visibleValues = [
    base,
    afterContract,
    afterCredit,
    afterInsurance,
    afterNonCompete,
    total,
    referenceRange.min,
    referenceRange.max,
  ];

  const rawMin = Math.min(...visibleValues);
  const rawMax = Math.max(...visibleValues);
  const dynamicPadding = Math.max((rawMax - rawMin) * 0.22, 180_000);
  const displayMin = rawMin - dynamicPadding;
  const displayMax = rawMax + dynamicPadding;
  const span = Math.max(displayMax - displayMin, 1);

  const steps = [
    { shortLabel: "Baza", value: base, color: STEP_COLORS.base, kind: "base" },
    {
      shortLabel: "Kontrakt",
      value: afterContract,
      color: STEP_COLORS.contract,
      delta: data.adjustments.contract,
      kind: "adjustment",
    },
    {
      shortLabel: "Kredyt",
      value: afterCredit,
      color: STEP_COLORS.credit,
      delta: data.adjustments.credit,
      kind: "adjustment",
    },
    {
      shortLabel: "Ubezp.",
      value: afterInsurance,
      color: STEP_COLORS.insurance,
      delta: data.adjustments.insurance,
      kind: "adjustment",
    },
    {
      shortLabel: "Zakaz konk.",
      value: afterNonCompete,
      color: STEP_COLORS.nonCompete,
      delta: data.adjustments.non_compete,
      kind: "adjustment",
    },
    { shortLabel: "Wynik", value: total, color: STEP_COLORS.final, kind: "final" },
  ];

  const valueToY = (value) => {
    const ratio = (value - displayMin) / span;
    return FLOW_PADDING.top + (1 - ratio) * plotHeight;
  };

  const points = steps.map((step, index) => ({
    ...step,
    x: FLOW_PADDING.left + (plotWidth / (steps.length - 1)) * index,
    y: valueToY(step.value),
  }));

  const referenceTop = valueToY(referenceRange.max);
  const referenceBottom = valueToY(referenceRange.min);
  const referenceHeight = Math.max(referenceBottom - referenceTop, 0);

  const referenceMarkup = `
    <rect
      class="flow-reference-band"
      x="${FLOW_PADDING.left}"
      y="${referenceTop}"
      width="${plotWidth}"
      height="${referenceHeight}"
      rx="22"
      ry="22"
    ></rect>
    <text class="flow-reference-label" x="${FLOW_PADDING.left + 16}" y="${referenceTop + 22}">Zakres referencyjny</text>
  `;

  const segmentMarkup = points
    .slice(1)
    .map((point, index) => {
      const previousPoint = points[index];
      const label = point.kind === "final" ? "Wynik" : formatCompactSignedMoney(point.delta);
      const pillY = (previousPoint.y + point.y) / 2 + (point.y <= previousPoint.y ? -16 : 16);
      const lineClass = point.kind === "final" ? "flow-segment flow-segment-final" : "flow-segment";

      return `
        <g>
          <line class="${lineClass}" x1="${previousPoint.x}" y1="${previousPoint.y}" x2="${point.x}" y2="${point.y}" stroke="${point.color}"></line>
          ${buildPillMarkup((previousPoint.x + point.x) / 2, pillY, label, "segment")}
        </g>
      `;
    })
    .join("");

  const pointMarkup = points
    .map((point) => {
      const pillY = point.y < FLOW_PADDING.top + 24 ? point.y + 22 : point.y - 18;
      const labelY = FLOW_HEIGHT - 8;
      const radius = point.kind === "final" ? 8 : 7;

      return `
        <g>
          ${buildPillMarkup(point.x, pillY, formatCompactMoney(point.value), "point")}
          <circle class="flow-node" cx="${point.x}" cy="${point.y}" r="${radius}" fill="${point.color}"></circle>
          <text class="flow-step-label" x="${point.x}" y="${labelY}" text-anchor="middle">${point.shortLabel}</text>
        </g>
      `;
    })
    .join("");

  elements.impactFlowSvg.innerHTML = `
    ${referenceMarkup}
    ${segmentMarkup}
    ${pointMarkup}
  `;
}

function updateStoryCards(data) {
  const base = data.base_value;
  const afterContract = base + data.adjustments.contract;
  const afterCredit = afterContract + data.adjustments.credit;
  const afterInsurance = afterCredit + data.adjustments.insurance;
  const total = data.total;

  elements.storyBaseValue.textContent = formatMoney(base);
  elements.storyBaseText.textContent = "Punkt startowy.";
  setCardState(elements.storyBaseCard, 0);

  elements.storyContractValue.textContent = formatSignedMoney(data.adjustments.contract);
  elements.storyContractText.textContent = `Po tym kroku: ${formatMoney(afterContract)}.`;
  applyAdjustmentClass(elements.storyContractValue, data.adjustments.contract);
  setCardState(elements.storyContractCard, data.adjustments.contract);

  elements.storyCreditValue.textContent = formatSignedMoney(data.adjustments.credit);
  elements.storyCreditText.textContent = `Po tym kroku: ${formatMoney(afterCredit)}.`;
  applyAdjustmentClass(elements.storyCreditValue, data.adjustments.credit);
  setCardState(elements.storyCreditCard, data.adjustments.credit);

  elements.storyInsuranceValue.textContent = formatSignedMoney(data.adjustments.insurance);
  elements.storyInsuranceText.textContent = `Po tym kroku: ${formatMoney(afterInsurance)}.`;
  applyAdjustmentClass(elements.storyInsuranceValue, data.adjustments.insurance);
  setCardState(elements.storyInsuranceCard, data.adjustments.insurance);

  elements.storyNonCompeteValue.textContent = formatSignedMoney(data.adjustments.non_compete);
  elements.storyNonCompeteText.textContent = `Przed finałem: ${formatMoney(total)}.`;
  applyAdjustmentClass(elements.storyNonCompeteValue, data.adjustments.non_compete);
  setCardState(elements.storyNonCompeteCard, data.adjustments.non_compete);

  elements.storyFinalValue.textContent = formatMoney(total);

  if (total < data.reference_range.min) {
    elements.storyFinalText.textContent = "Wynik końcowy jest poniżej zakresu referencyjnego.";
    applyAdjustmentClass(elements.storyFinalValue, -1);
    setCardState(elements.storyFinalCard, -1);
  } else if (total > data.reference_range.max) {
    elements.storyFinalText.textContent = "Wynik końcowy jest powyżej zakresu referencyjnego.";
    applyAdjustmentClass(elements.storyFinalValue, 1);
    setCardState(elements.storyFinalCard, 1);
  } else {
    elements.storyFinalText.textContent = "Wynik końcowy mieści się w zakresie referencyjnym.";
    applyAdjustmentClass(elements.storyFinalValue, 0);
    setCardState(elements.storyFinalCard, 0);
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

    elements.contractHint.textContent = `Aktualna wartość kontraktu: ${contractComponent} z maksymalnych 2.00 mln zł.`;
    elements.totalValue.textContent = formatMoney(data.total);
    elements.propertyAndEquipmentValue.textContent = formatMoney(data.property_and_equipment_value);

    renderImpactFlow(data);
    updateStoryCards(data);

    if (data.total < data.reference_range.min) {
      elements.rangeStatus.textContent = "Wartość jest poniżej zakresu referencyjnego 7.40-7.80 mln zł.";
    } else if (data.total > data.reference_range.max) {
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
