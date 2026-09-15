const API_URL = "https://api.hypixel.net/v2/resources/skyblock/election";

const elements = {
  refreshButton: document.querySelector("#refreshButton"),
  status: document.querySelector("#status"),
  statusText: document.querySelector("#statusText"),
  leadership: document.querySelector("#leadership"),
  electionTitle: document.querySelector("#electionTitle"),
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

function perkElement(perk, showMinister = true) {
  const wrapper = document.createElement("div");
  wrapper.className = "perk";

  const name = document.createElement("div");
  name.className = "perk-name";
  name.append(cleanText(perk.name || "Unknown perk"));

  if (showMinister && perk.minister) {
    const badge = document.createElement("span");
    badge.className = "minister-badge";
    badge.textContent = "Minister perk";
    name.append(badge);
  }

  const description = document.createElement("p");
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

function renderCandidates(election) {
  const candidates = [...(election?.candidates || [])].sort(
    (a, b) => (b.votes || 0) - (a.votes || 0)
  );

  const totalVotes = candidates.reduce(
    (sum, candidate) => sum + (candidate.votes || 0),
    0
  );

  elements.electionTitle.textContent = election?.year
    ? `Year ${election.year} candidates`
    : "Candidates";

  elements.totalVotes.textContent = numberFormatter.format(totalVotes);
  elements.candidateGrid.replaceChildren();

  if (!candidates.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "There is no ongoing election right now.";
    elements.candidateGrid.append(empty);
    return;
  }

  candidates.forEach((candidate, index) => {
    const fragment = elements.candidateTemplate.content.cloneNode(true);
    const card = fragment.querySelector("article");

    const votes = candidate.votes || 0;
    const percentage = totalVotes ? (votes / totalVotes) * 100 : 0;

    if (index === 0) {
      card.classList.add("leading");
    }

    card.querySelector(".rank").textContent =
      index === 0 ? "CURRENT LEADER" : `RANK ${index + 1}`;

    card.querySelector(".candidate-name").textContent = cleanText(
      candidate.name || candidate.key || "Unknown"
    );

    const voteElement = card.querySelector(".candidate-votes");
    const voteTotal = document.createElement("strong");

    voteTotal.textContent = numberFormatter.format(votes);
    voteElement.append(voteTotal, `${percentage.toFixed(1)}%`);

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
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.cause || "Hypixel returned an unsuccessful response"
      );
    }

    renderLeadership(data.mayor || {});
    renderCandidates(data.election || data.current || {});

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
