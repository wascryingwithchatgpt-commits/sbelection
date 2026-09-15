const API_URL = "https://api.hypixel.net/v2/resources/skyblock/election";

const MAYOR_POOL = [
  { name: "Aatrox", type: "Regular", perks: ["Slayer XP Buff", "Pathfinder", "SLASHED Pricing"] },
  { name: "Cole", type: "Regular", perks: ["Mining XP Buff", "Prospection", "Mining Fiesta", "Molten Forge"] },
  { name: "Diana", type: "Regular", perks: ["Lucky!", "Mythological Ritual", "Pet XP Buff", "Sharing is Caring"] },
  { name: "Diaz", type: "Regular", perks: ["Long Term Investment", "Shopping Spree", "Stock Exchange", "Volume Trading"] },
  { name: "Finnegan", type: "Regular", perks: ["Farming Simulator", "Pelt-pocalypse", "Pest Eradicator", "Blooming Business"] },
  { name: "Foxy", type: "Regular", perks: ["Sweet Benevolence", "Extra Event", "Chivalrous Carnival"] },
  { name: "Marina", type: "Regular", perks: ["Fishing XP Buff", "Luck of the Sea 2.0", "Fishing Festival", "Double Trouble"] },
  { name: "Paul", type: "Regular", perks: ["EZPZ", "Marauder", "Benediction"] },
  { name: "Derpy", type: "Special rotation", perks: ["TURBO MINIONS!!!", "AH CLOSED!", "DOUBLE MOBS HP!!!", "MOAR SKILLZ!!!"] },
  { name: "Jerry", type: "Special rotation", perks: ["Perkpocalypse", "Statspocalypse", "Jerrypocalypse"] },
  { name: "Scorpius", type: "Special rotation", perks: ["Bribe", "Darker Auctions"] }
];

const elements = {
  refreshButton: document.querySelector("#refreshButton"),
  status: document.querySelector("#status"),
  statusText: document.querySelector("#statusText"),
  leadership: document.querySelector("#leadership"),
  sectionEyebrow: document.querySelector("#sectionEyebrow"),
  electionTitle: document.querySelector("#electionTitle"),
  voteSummary: document.querySelector("#voteSummary"),
  totalVotes: document.querySelector("#totalVotes"),
  candidateGrid: document.querySelector("#candidateGrid"),
  leadershipTemplate: document.querySelector("#leadershipTemplate"),
  candidateTemplate: document.querySelector("#candidateTemplate")
};

const numberFormatter = new Intl.NumberFormat();
const colorCodePattern = /§[0-9A-FK-OR]/gi;

function cleanText(value = "") {
  return String(value).replace(colorCodePattern, "").trim();
}

function perkElement(perk, options = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "perk";

  const name = document.createElement("div");
  name.className = "perk-name";
  name.append(cleanText(perk?.name || perk || "Unknown perk"));

  if (options.showMinister && perk?.minister) {
    const badge = document.createElement("span");
    badge.className = "minister-badge";
    badge.textContent = "Minister perk";
    name.append(badge);
  }

  if (options.estimated) {
    const badge = document.createElement("span");
    badge.className = "estimated-badge";
    badge.textContent = "Possible";
    name.append(badge);
  }

  const description = document.createElement("p");

  description.textContent = options.estimated
    ? "This perk may appear when the next election opens."
    : cleanText(perk?.description || "No description available.");

  wrapper.append(name, description);
  return wrapper;
}

function leadershipCard(label, person, className) {
  const fragment = elements.leadershipTemplate.content.cloneNode(true);
  const card = fragment.querySelector("article");

  card.className = `leader-card ${className}`;
  card.querySelector(".card-label").textContent = label;
  card.querySelector(".leader-name").textContent = cleanText(
    person?.name || "Unknown"
  );

  const perkList = card.querySelector(".perk-list");
  const perks = person?.perks || (person?.perk ? [person.perk] : []);

  perks.forEach(perk => {
    perkList.append(perkElement(perk));
  });

  if (!perks.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No active perks listed.";
    perkList.append(empty);
  }

  return fragment;
}

function renderLeadership(mayor) {
  elements.leadership.replaceChildren();

  elements.leadership.append(
    leadershipCard("Current mayor", mayor, "mayor-card")
  );

  if (mayor?.minister) {
    elements.leadership.append(
      leadershipCard(
        "Current minister",
        mayor.minister,
        "minister-card"
      )
    );
  }
}

function renderCandidates(election) {
  const candidates = [...election.candidates].sort(
    (a, b) => (b.votes || 0) - (a.votes || 0)
  );

  const totalVotes = candidates.reduce(
    (sum, candidate) => sum + (candidate.votes || 0),
    0
  );

  elements.sectionEyebrow.textContent = "ONGOING ELECTION";

  elements.electionTitle.textContent = election.year
    ? `Year ${election.year} candidates`
    : "Candidates";

  elements.totalVotes.textContent = numberFormatter.format(totalVotes);
  elements.voteSummary.classList.remove("hidden");
  elements.candidateGrid.replaceChildren();

  candidates.forEach((candidate, index) => {
    const fragment =
      elements.candidateTemplate.content.cloneNode(true);

    const card = fragment.querySelector("article");

    const percentage = totalVotes
      ? ((candidate.votes || 0) / totalVotes) * 100
      : 0;

    if (index === 0) {
      card.classList.add("leading");
    }

    card.querySelector(".rank").textContent =
      index === 0
        ? "CURRENT LEADER"
        : `RANK ${index + 1}`;

    card.querySelector(".candidate-name").textContent =
      cleanText(candidate.name || candidate.key || "Unknown");

    card.querySelector(".candidate-votes").innerHTML =
      `<strong>${numberFormatter.format(candidate.votes || 0)}</strong>` +
      `${percentage.toFixed(1)}%`;

    card.querySelector(".vote-bar span").style.width =
      `${percentage}%`;

    card.querySelector(".vote-bar").setAttribute(
      "aria-label",
      `${percentage.toFixed(1)} percent of votes`
    );

    const perks = card.querySelector(".candidate-perks");

    (candidate.perks || []).forEach(perk => {
      perks.append(
        perkElement(perk, { showMinister: true })
      );
    });

    elements.candidateGrid.append(fragment);
  });
}

function renderPossibleMayors(currentMayor) {
  const currentName =
    cleanText(currentMayor?.name).toLowerCase();

  const possibleMayors = MAYOR_POOL.filter(
    mayor => mayor.name.toLowerCase() !== currentName
  );

  elements.sectionEyebrow.textContent = "NEXT ELECTION";
  elements.electionTitle.textContent = "Possible next mayors";
  elements.voteSummary.classList.add("hidden");
  elements.candidateGrid.replaceChildren();

  possibleMayors.forEach(mayor => {
    const fragment =
      elements.candidateTemplate.content.cloneNode(true);

    const card = fragment.querySelector("article");

    card.classList.add("estimated");

    card.querySelector(".rank").textContent =
      mayor.type === "Regular"
        ? "POSSIBLE MAYOR"
        : "SPECIAL ROTATION";

    card.querySelector(".candidate-name").textContent =
      mayor.name;

    card.querySelector(".candidate-votes").remove();
    card.querySelector(".vote-bar").remove();

    const perks = card.querySelector(".candidate-perks  const description = document.createElement("p");
  description.textContent = cleanText(
    perk.description || "No description available."
  );

  wrapper.append(name, description);
  return wrapper;
}

function leadershipCard(label, person, className) {
  const fragment = elements.leadershipTemplate.content.cloneNode(true);
  const card = fragment.querySelector("article");

  card.className = `leader-card ${className}`;
  card.querySelector(".card-label").textContent = label;
  card.querySelector(".leader-name").textContent = cleanText(
    person?.name || "Unknown"
  );

  const perkList = card.querySelector(".perk-list");
  const perks = person?.perks || (person?.perk ? [person.perk] : []);

  perks.forEach(perk => {
    perkList.append(perkElement(perk, false));
  });

  if (!perks.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No active perks listed.";
    perkList.append(empty);
  }

  return fragment;
}

function renderLeadership(mayor) {
  elements.leadership.replaceChildren();

  elements.leadership.append(
    leadershipCard("Current mayor", mayor, "mayor-card")
  );

  if (mayor?.minister) {
    elements.leadership.append(
      leadershipCard(
        "Current minister",
        mayor.minister,
        "minister-card"
      )
    );
  }
}

function renderCandidates(election, mayor) {
  const allCandidates = [...(election?.candidates || [])].sort(
    (a, b) => (b.votes || 0) - (a.votes || 0)
  );

  const totalVotes = allCandidates.reduce(
    (sum, candidate) => sum + (candidate.votes || 0),
    0
  );

  const selectedMayorName = cleanText(mayor?.name || "").toLowerCase();

  const unselectedCandidates = allCandidates.filter(candidate => {
    const candidateName = cleanText(
      candidate.name || candidate.key || ""
    ).toLowerCase();

    return candidateName !== selectedMayorName;
  });

  elements.electionTitle.textContent = election?.year
    ? `Year ${election.year} unselected candidates`
    : "Unselected candidates";

  elements.totalVotes.textContent = numberFormatter.format(totalVotes);
  elements.candidateGrid.replaceChildren();

  if (!unselectedCandidates.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No unselected candidates are available.";
    elements.candidateGrid.append(empty);
    return;
  }

  unselectedCandidates.forEach(candidate => {
    const fragment = elements.candidateTemplate.content.cloneNode(true);
    const card = fragment.querySelector("article");

    const votes = candidate.votes || 0;
    const percentage = totalVotes
      ? (votes / totalVotes) * 100
      : 0;

    const originalRank =
      allCandidates.findIndex(item => item === candidate) + 1;

    card.querySelector(".rank").textContent =
      originalRank === 2
        ? "RUNNER-UP"
        : `RANK ${originalRank}`;

    card.querySelector(".candidate-name").textContent = cleanText(
      candidate.name || candidate.key || "Unknown"
    );

    const voteElement = card.querySelector(".candidate-votes");
    const voteTotal = document.createElement("strong");

    voteTotal.textContent = numberFormatter.format(votes);
    voteElement.append(
      voteTotal,
      `${percentage.toFixed(1)}%`
    );

    const voteBar = card.querySelector(".vote-bar");
    voteBar.querySelector("span").style.width = `${percentage}%`;
    voteBar.setAttribute(
      "aria-label",
      `${percentage.toFixed(1)} percent of votes`
    );

    const perks = card.querySelector(".candidate-perks");

    (candidate.perks || []).forEach(perk => {
      perks.append(perkElement(perk));
    });

    if (!candidate.perks?.length) {
      const emptyPerk = document.createElement("div");
      emptyPerk.className = "perk";
      emptyPerk.textContent = "No perks listed.";
      perks.append(emptyPerk);
    }

    elements.candidateGrid.append(fragment);
  });
}

function setStatus(message, state = "") {
  elements.status.className = `status ${state}`.trim();
  elements.statusText.textContent = message;
}

async function loadElection() {
  elements.refreshButton.disabled = true;
  setStatus("Loading the latest election…");

  try {
    const response = await fetch(API_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `Request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.cause ||
        "Hypixel returned an unsuccessful response"
      );
    }

    const mayor = data.mayor || {};
    const election = data.election || data.current || {};

    renderLeadership(mayor);
    renderCandidates(election, mayor);

    const updated = data.lastUpdated
      ? new Date(data.lastUpdated)
      : new Date();

    setStatus(
      `Live data · Updated ${updated.toLocaleString()}`,
      "loaded"
    );
  } catch (error) {
    console.error(error);

    setStatus(
      "Could not load Hypixel election data. Try refreshing in a moment.",
      "error"
    );

    elements.leadership.replaceChildren();

    const errorPanel = document.createElement("div");
    errorPanel.className = "error-panel";
    errorPanel.textContent =
      "The tracker could not reach the Hypixel API.";

    elements.candidateGrid.replaceChildren(errorPanel);
  } finally {
    elements.refreshButton.disabled = false;
  }
}

elements.refreshButton.addEventListener("click", loadElection);

loadElection();
