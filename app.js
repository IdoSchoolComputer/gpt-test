const pockets = [
  { number: 0, color: "green" },
  { number: 32, color: "red" },
  { number: 15, color: "black" },
  { number: 19, color: "red" },
  { number: 4, color: "black" },
  { number: 21, color: "red" },
  { number: 2, color: "black" },
  { number: 25, color: "red" },
  { number: 17, color: "black" },
  { number: 34, color: "red" },
  { number: 6, color: "black" },
  { number: 27, color: "red" },
  { number: 13, color: "black" },
  { number: 36, color: "red" },
  { number: 11, color: "black" },
  { number: 30, color: "red" },
  { number: 8, color: "black" },
  { number: 23, color: "red" },
  { number: 10, color: "black" },
  { number: 5, color: "red" },
  { number: 24, color: "black" },
  { number: 16, color: "red" },
  { number: 33, color: "black" },
  { number: 1, color: "red" },
  { number: 20, color: "black" },
  { number: 14, color: "red" },
  { number: 31, color: "black" },
  { number: 9, color: "red" },
  { number: 22, color: "black" },
  { number: 18, color: "red" },
  { number: 29, color: "black" },
  { number: 7, color: "red" },
  { number: 28, color: "black" },
  { number: 12, color: "red" },
  { number: 35, color: "black" },
  { number: 3, color: "red" },
  { number: 26, color: "black" }
];

const wheel = document.getElementById("wheel");
const ball = document.getElementById("ball");
const resultChip = document.getElementById("result-chip");
const resultText = document.getElementById("result-text");
const resultNote = document.getElementById("result-note");
const spinButton = document.getElementById("spin");
const resetButton = document.getElementById("reset");
const autoSpinToggle = document.getElementById("auto-spin");
const spinsValue = document.getElementById("spins");
const redPercent = document.getElementById("red-percent");
const blackPercent = document.getElementById("black-percent");
const greenPercent = document.getElementById("green-percent");
const historyEl = document.getElementById("history");
const ledgerEl = document.getElementById("ledger");
const balanceEl = document.getElementById("balance");
const debtEl = document.getElementById("debt");
const netEl = document.getElementById("net");
const betAmountInput = document.getElementById("bet-amount");
const numberPick = document.getElementById("number-pick");
const borrowButton = document.getElementById("borrow");
const repayButton = document.getElementById("repay");
const maxBetButton = document.getElementById("max-bet");
const quickBetButtons = document.querySelectorAll("[data-bet]");
const betTypeInputs = document.querySelectorAll("input[name='bet-type']");
const colorButtons = document.querySelectorAll(".color-picks .chip");

let spins = 0;
let reds = 0;
let blacks = 0;
let greens = 0;
let rotation = 0;
let balance = 1000;
let debt = 0;
let selectedColor = "red";
let autoSpinInterval = null;

const colorMap = {
  red: "var(--red)",
  black: "var(--black)",
  green: "var(--green)"
};

const formatMoney = (value) => {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString()}`;
};

const updateBankroll = () => {
  balanceEl.textContent = formatMoney(balance);
  debtEl.textContent = formatMoney(debt);
  netEl.textContent = formatMoney(balance - debt);
};

const updateStats = () => {
  spinsValue.textContent = spins;
  const redRatio = spins ? (reds / spins) * 100 : 0;
  const blackRatio = spins ? (blacks / spins) * 100 : 0;
  const greenRatio = spins ? (greens / spins) * 100 : 0;
  redPercent.textContent = `${redRatio.toFixed(1)}%`;
  blackPercent.textContent = `${blackRatio.toFixed(1)}%`;
  greenPercent.textContent = `${greenRatio.toFixed(1)}%`;
};

const addHistory = (pocket) => {
  const chip = document.createElement("div");
  chip.className = `chip ${pocket.color}`;
  chip.textContent = pocket.number;
  historyEl.prepend(chip);
  if (historyEl.children.length > 18) {
    historyEl.removeChild(historyEl.lastChild);
  }
};

const addLedger = (message) => {
  const entry = document.createElement("div");
  entry.className = "ledger-entry";
  entry.textContent = message;
  ledgerEl.prepend(entry);
  if (ledgerEl.children.length > 10) {
    ledgerEl.removeChild(ledgerEl.lastChild);
  }
};

const getRandomIndex = (max) => {
  if (!window.crypto || !window.crypto.getRandomValues) {
    return Math.floor(Math.random() * max);
  }
  const range = 0xffffffff;
  const bucketSize = Math.floor(range / max) * max;
  const buffer = new Uint32Array(1);
  let value = range;
  while (value >= bucketSize) {
    window.crypto.getRandomValues(buffer);
    value = buffer[0];
  }
  return value % max;
};

const getBetType = () => {
  const selected = Array.from(betTypeInputs).find((input) => input.checked);
  return selected ? selected.value : "color";
};

const getBetAmount = () => {
  const parsed = Number.parseInt(betAmountInput.value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 0;
  }
  return parsed;
};

const adjustBet = (amount) => {
  const current = getBetAmount();
  betAmountInput.value = Math.max(1, current + amount);
};

const applyInterest = () => {
  if (debt <= 0 || spins % 5 !== 0) {
    return;
  }
  debt = Math.ceil(debt * 1.1);
  addLedger("Loan shark collected 10% interest.");
};

const resolveBet = (pocket, betAmount, betType) => {
  if (betAmount <= 0) {
    return 0;
  }
  if (betType === "color") {
    if (pocket.color === selectedColor) {
      return betAmount;
    }
    return -betAmount;
  }
  const pickedNumber = Number.parseInt(numberPick.value, 10);
  if (pocket.number === pickedNumber) {
    return betAmount * 35;
  }
  return -betAmount;
};

const resetBallAnimation = () => {
  ball.style.animation = "none";
  ball.offsetHeight;
};

const spin = () => {
  const betAmount = getBetAmount();
  const betType = getBetType();

  if (betAmount > balance) {
    resultText.textContent = "Not enough balance";
    resultNote.textContent = "Borrow or lower your bet.";
    return;
  }

  spinButton.disabled = true;
  const index = getRandomIndex(pockets.length);
  const pocket = pockets[index];

  const degreesPerPocket = 360 / pockets.length;
  const targetAngle = index * degreesPerPocket + degreesPerPocket / 2;
  rotation += 720 + (360 - targetAngle);
  wheel.style.transition = "transform 2.8s cubic-bezier(0.2, 0.8, 0.2, 1)";
  wheel.style.transform = `rotate(${rotation}deg)`;

  resetBallAnimation();
  ball.style.animation = "ball-orbit 2.8s cubic-bezier(0.2, 0.8, 0.2, 1)";

  setTimeout(() => {
    spins += 1;
    if (pocket.color === "red") reds += 1;
    if (pocket.color === "black") blacks += 1;
    if (pocket.color === "green") greens += 1;

    const payout = resolveBet(pocket, betAmount, betType);
    balance += payout;

    resultChip.textContent = pocket.number;
    resultChip.className = `chip ${pocket.color}`;
    resultText.textContent = `Result: ${pocket.number} (${pocket.color})`;
    if (payout >= 0) {
      resultNote.textContent = `You won ${formatMoney(payout)}.`;
      addLedger(`Win ${formatMoney(payout)} on ${betType} bet.`);
    } else {
      resultNote.textContent = `You lost ${formatMoney(Math.abs(payout))}.`;
      addLedger(`Loss ${formatMoney(Math.abs(payout))} on ${betType} bet.`);
    }

    addHistory(pocket);
    applyInterest();
    updateStats();
    updateBankroll();
    spinButton.disabled = false;
  }, 2800);
};

const reset = () => {
  spins = 0;
  reds = 0;
  blacks = 0;
  greens = 0;
  balance = 1000;
  debt = 0;
  updateStats();
  updateBankroll();
  historyEl.innerHTML = "";
  ledgerEl.innerHTML = "";
  resultChip.textContent = "0";
  resultChip.className = "chip green";
  resultText.textContent = "Ready to spin";
  resultNote.textContent = "Place a bet to get started.";
};

const populateNumbers = () => {
  for (let i = 1; i <= 36; i += 1) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = String(i);
    numberPick.append(option);
  }
};

colorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    colorButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    selectedColor = button.dataset.color;
  });
});

quickBetButtons.forEach((button) => {
  button.addEventListener("click", () => adjustBet(Number(button.dataset.bet)));
});

maxBetButton.addEventListener("click", () => {
  betAmountInput.value = Math.max(1, balance);
});

borrowButton.addEventListener("click", () => {
  balance += 500;
  debt += 500;
  addLedger("Borrowed $500 from the loan shark.");
  updateBankroll();
});

repayButton.addEventListener("click", () => {
  if (balance < 250 || debt <= 0) {
    addLedger("Need cash or no debt to repay.");
    return;
  }
  balance -= 250;
  debt = Math.max(0, debt - 250);
  addLedger("Repaid $250 to the loan shark.");
  updateBankroll();
});

autoSpinToggle.addEventListener("change", (event) => {
  if (event.target.checked) {
    autoSpinInterval = setInterval(() => {
      if (!spinButton.disabled) {
        spin();
      }
    }, 3200);
  } else {
    clearInterval(autoSpinInterval);
    autoSpinInterval = null;
  }
});

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", reset);

populateNumbers();
updateStats();
updateBankroll();
colorButtons[0].classList.add("active");
reset();
