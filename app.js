const API_URL =
  "https://api.hypixel.net/v2/resources/skyblock/election";

const MAYOR_DATA_URL = "data/mayors.json";

const MAYOR_NAMES = [
  "Aatrox",
  "Cole",
  "Diana",
  "Diaz",
  "Finnegan",
  "Foxy",
  "Marina",
  "Paul",
  "Derpy",
  "Jerry",
  "Scorpius"
];

const elements = {
  refreshButton:
    document.querySelector("#refreshButton"),
  status:
    document.querySelector("#status"),
  statusText:
    document.querySelector("#statusText"),
  selectedTab:
    document.querySelector("#selectedTab"),
  mayorDataTab:
    document.querySelector("#mayorDataTab"),
  selectedView:
    document.querySelector("#selectedView"),
  mayorDataView:
    document.querySelector("#mayorDataView"),
  leadership:
    document.querySelector("#leadership"),
  sectionEyebrow:
    document.querySelector("#sectionEyebrow"),
  electionTitle:
    document.querySelector("#electionTitle"),
  voteSummary:
    document.querySelector("#voteSummary"),
  totalVotes:
    document.querySelector("#totalVotes"),
  candidateGrid:
    document.querySelector("#candidateGrid"),
  mayorDataGrid:
    document.querySelector("#mayorDataGrid"),
  leadershipTemplate:
    document.querySelector("#leadershipTemplate"),
  candidateTemplate:
    document.querySelector("#candidateTemplate")
};

const numberFormatter =
  new Intl.NumberFormat();

const colorCodePattern =
  /§[0-9A-FK-OR]/gi;

function cleanText(value = "") {
  return String(value)
    .replace(colorCodePattern, "")
    .trim();
}

function setStatus(message, state = "") {
  elements.status.className =
    `status ${state}`.trim();

  elements.statusText.textContent =
    message;
}

function createPerkElement(perk) {
  const wrapper =
    document.createElement("div");

  wrapper.className = "perk";

  const name =
    document.createElement("div");

  name.className = "perk-name";

  name.append(
    cleanText(
      perk?.name || "Unknown perk"
    )
  );

  if (perk?.minister) {
    const badge =
      document.createElement("span");

    badge.className =
      "minister-badge";

    badge.textContent =
      "Minister perk";

    name.append(badge);
  }

  const description =
    document.createElement("p");

  description.textContent =
    cleanText(
      perk?.description ||
      "No description available."
    );

  wrapper.append(
    name,
    description
  );

  return wrapper;
}

function createEmptyMessage(message) {
  const empty =
    document.createElement("div");

  empty.className = "empty";
  empty.textContent = message;

  return empty;
}

function createLeadershipCard(
  label,
  person,
  className
) {
  const fragment =
    elements.leadershipTemplate
      .content
      .cloneNode(true);

  const card =
    fragment.querySelector("article");

  card.className =
    `leader-card ${className}`;

  card.querySelector(
    ".card-label"
  ).textContent = label;

  card.querySelector(
    ".leader-name"
  ).textContent = cleanText(
    person?.name || "Unknown"
  );

  const perkList =
    card.querySelector(".perk-list");

  const perks =
    person?.perks ||
    (person?.perk
      ? [person.perk]
      : []);

  perks.forEach(perk => {
    perkList.append(
      createPerkElement(perk)
    );
  });

  if (!perks.length) {
    perkList.append(
      createEmptyMessage(
        "No active perks listed."
      )
    );
  }

  return fragment;
}

function renderLeadership(mayor) {
  elements.leadership
    .replaceChildren();

  elements.leadership.append(
    createLeadershipCard(
      "Current mayor",
      mayor,
      "mayor-card"
    )
  );

  if (mayor?.minister) {
    elements.leadership.append(
      createLeadershipCard(
        "Current minister",
        mayor.minister,
        "minister-card"
      )
    );
  }
}

function renderElection(election) {
  const candidates =
    Array.isArray(
      election?.candidates
    )
      ? [...election.candidates]
          .sort(
            (a, b) =>
              (b.votes || 0) -
              (a.votes || 0)
          )
      : [];

  elements.candidateGrid
    .replaceChildren();

  if (!candidates.length) {
    elements.sectionEyebrow
      .textContent =
      "NO ONGOING ELECTION";

    elements.electionTitle
      .textContent =
      "Voting has not started";

    elements.voteSummary
      .classList
      .add("hidden");

    elements.candidateGrid.append(
      createEmptyMessage(
        "The next candidates will appear here when voting begins."
      )
    );

    return;
  }

  const totalVotes =
    candidates.reduce(
      (total, candidate) =>
        total +
        (candidate.votes || 0),
      0
    );

  elements.sectionEyebrow
    .textContent =
    "ONGOING ELECTION";

  elements.electionTitle
    .textContent =
    election.year
      ? `Year ${election.year} candidates`
      : "Current candidates";

  elements.totalVotes.textContent =
    numberFormatter.format(totalVotes);

  elements.voteSummary
    .classList
    .remove("hidden");

  candidates.forEach(
    (candidate, index) => {
      const fragment =
        elements.candidateTemplate
          .content
          .cloneNode(true);

      const card =
        fragment.querySelector(
          "article"
        );

      const votes =
        candidate.votes || 0;

      const percentage =
        totalVotes
          ? (votes / totalVotes) * 100
          : 0;

      if (index === 0) {
        card.classList.add(
          "leading"
        );
      }

      card.querySelector(
        ".rank"
      ).textContent =
        index === 0
          ? "CURRENT LEADER"
          : `RANK ${index + 1}`;

      card.querySelector(
        ".candidate-name"
      ).textContent =
        cleanText(
          candidate.name ||
          candidate.key ||
          "Unknown"
        );

      const voteElement =
        card.querySelector(
          ".candidate-votes"
        );

      const voteTotal =
        document.createElement(
          "strong"
        );

      voteTotal.textContent =
        numberFormatter.format(
          votes
        );

      voteElement.append(
        voteTotal,
        `${percentage.toFixed(1)}%`
      );

      const voteBar =
        card.querySelector(
          ".vote-bar"
        );

      voteBar.querySelector(
        "span"
      ).style.width =
        `${percentage}%`;

      voteBar.setAttribute(
        "aria-label",
        `${percentage.toFixed(1)} percent of votes`
      );

      const perkList =
        card.querySelector(
          ".candidate-perks"
        );

      const candidatePerks =
        Array.isArray(
          candidate.perks
        )
          ? candidate.perks
          : [];

      candidatePerks.forEach(
        perk => {
          perkList.append(
            createPerkElement(perk)
          );
        }
      );

      if (!candidatePerks.length) {
        perkList.append(
          createEmptyMessage(
            "No perks listed."
          )
        );
      }

      elements.candidateGrid
        .append(fragment);
    }
  );
}

function normalizeMayorRecord(record) {
  if (Array.isArray(record)) {
    return {
      perks: record,
      lastSeenYear: null,
      updatedAt: null,
      isCurrentMayor: false,
      lastBecameMayorAt: null,
      lastMayorEndedAt: null
    };
  }

  return {
    perks:
      Array.isArray(record?.perks)
        ? record.perks
        : [],
    lastSeenYear:
      record?.lastSeenYear ?? null,
    updatedAt:
      record?.updatedAt ?? null,
    isCurrentMayor:
      Boolean(
        record?.isCurrentMayor
      ),
    lastBecameMayorAt:
      record?.lastBecameMayorAt ??
      null,
    lastMayorEndedAt:
      record?.lastMayorEndedAt ??
      null
  };
}

function getTimeAgo(dateValue) {
  if (!dateValue) {
    return {
      main: "Not",
      secondary: "recorded yet"
    };
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(date.getTime())
  ) {
    return {
      main: "Not",
      secondary: "recorded yet"
    };
  }

  const difference =
    Date.now() - date.getTime();

  const minutes = Math.max(
    0,
    Math.floor(
      difference / 60000
    )
  );

  if (minutes < 1) {
    return {
      main: "Just now",
      secondary: "term ended"
    };
  }

  if (minutes < 60) {
    return {
      main: `${minutes} min`,
      secondary: "ago"
    };
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return {
      main: `${hours} hr`,
      secondary: "ago"
    };
  }

  const days =
    Math.floor(hours / 24);

  if (days < 7) {
    return {
      main: `${days} day${days === 1 ? "" : "s"}`,
      secondary: "ago"
    };
  }

  const weeks =
    Math.floor(days / 7);

  if (weeks < 5) {
    return {
      main: `${weeks} week${weeks === 1 ? "" : "s"}`,
      secondary: "ago"
    };
  }

  const months =
    Math.floor(days / 30);

  if (months < 12) {
    return {
      main: `${months} month${months === 1 ? "" : "s"}`,
      secondary: "ago"
    };
  }

  const years =
    Math.floor(days / 365);

  return {
    main: `${years} year${years === 1 ? "" : "s"}`,
    secondary: "ago"
  };
}

function renderMayorData(database) {
  elements.mayorDataGrid
    .replaceChildren();

  const databaseNames =
    Object.keys(database || {})
      .filter(
        name => name !== "_meta"
      );

  const names = [
    ...new Set([
      ...MAYOR_NAMES,
      ...databaseNames
    ])
  ];

  const currentMayorName =
    cleanText(
      database?._meta
        ?.currentMayor || ""
    );

  names.forEach(name => {
    const record =
      normalizeMayorRecord(
        database?.[name]
      );

    const fragment =
      elements.candidateTemplate
        .content
        .cloneNode(true);

    const card =
      fragment.querySelector(
        "article"
      );

    card.classList.add(
      "saved-mayor"
    );

    const isCurrentMayor =
      record.isCurrentMayor ||
      name.toLowerCase() ===
        currentMayorName
          .toLowerCase();

    card.querySelector(
      ".rank"
    ).textContent =
      record.lastSeenYear
        ? `PERKS SAVED: YEAR ${record.lastSeenYear}`
        : "NO SAVED ELECTION";

    card.querySelector(
      ".candidate-name"
    ).textContent = name;

    const statusElement =
      card.querySelector(
        ".candidate-votes"
      );

    const mainStatus =
      document.createElement(
        "strong"
      );

    if (isCurrentMayor) {
      mainStatus.textContent =
        "Current";

      statusElement.append(
        mainStatus,
        "mayor"
      );
    } else {
      const timeAgo =
        getTimeAgo(
          record.lastMayorEndedAt
        );

      mainStatus.textContent =
        timeAgo.main;

      statusElement.append(
        mainStatus,
        timeAgo.secondary
      );
    }

    card.querySelector(
      ".vote-bar"
    ).remove();

    const perkList =
      card.querySelector(
        ".candidate-perks"
      );

    record.perks.forEach(
      perk => {
        perkList.append(
          createPerkElement(perk)
        );
      }
    );

    if (!record.perks.length) {
      perkList.append(
        createEmptyMessage(
          "No perk data recorded yet."
        )
      );
    }

    if (record.updatedAt) {
      const updated =
        document.createElement("p");

      updated.className =
        "saved-date";

      updated.textContent =
        `Perks saved ${new Date(
          record.updatedAt
        ).toLocaleString()}`;

      card.append(updated);
    }

    elements.mayorDataGrid
      .append(fragment);
  });
}

function switchView(view) {
  const showingSelected =
    view === "selected";

  elements.selectedView
    .classList
    .toggle(
      "hidden",
      !showingSelected
    );

  elements.mayorDataView
    .classList
    .toggle(
      "hidden",
      showingSelected
    );

  elements.selectedTab
    .classList
    .toggle(
      "active",
      showingSelected
    );

  elements.mayorDataTab
    .classList
    .toggle(
      "active",
      !showingSelected
    );

  elements.selectedTab
    .setAttribute(
      "aria-selected",
      String(showingSelected)
    );

  elements.mayorDataTab
    .setAttribute(
      "aria-selected",
      String(!showingSelected)
    );
}

async function fetchMayorDatabase() {
  const response = await fetch(
    `${MAYOR_DATA_URL}?time=${Date.now()}`,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `Mayor database returned ${response.status}`
    );
  }

  return response.json();
}

async function fetchElection() {
  const response = await fetch(
    API_URL,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `Hypixel API returned ${response.status}`
    );
  }

  const data =
    await response.json();

  if (!data.success) {
    throw new Error(
      data.cause ||
      "Hypixel returned an unsuccessful response"
    );
  }

  return data;
}

async function loadTracker() {
  elements.refreshButton.disabled =
    true;

  setStatus(
    "Loading the latest data…"
  );

  try {
    const [
      electionData,
      mayorDatabase
    ] = await Promise.all([
      fetchElection(),
      fetchMayorDatabase()
    ]);

    renderLeadership(
      electionData.mayor || {}
    );

    renderElection(
      electionData.election ||
      electionData.current ||
      {}
    );

    renderMayorData(
      mayorDatabase
    );

    const updated =
      electionData.lastUpdated
        ? new Date(
            electionData.lastUpdated
          )
        : new Date();

    setStatus(
      `Live data · Updated ${updated.toLocaleString()}`,
      "loaded"
    );
  } catch (error) {
    console.error(error);

    setStatus(
      "Could not load all election data. Try refreshing.",
      "error"
    );
  } finally {
    elements.refreshButton.disabled =
      false;
  }
}

elements.selectedTab
  .addEventListener(
    "click",
    () => switchView("selected")
  );

elements.mayorDataTab
  .addEventListener(
    "click",
    () => switchView("mayor-data")
  );

elements.refreshButton
  .addEventListener(
    "click",
    loadTracker
  );

switchView("selected");
loadTracker();
