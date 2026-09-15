const fs = require("fs");
const path = require("path");

const API_URL =
  "https://api.hypixel.net/v2/resources/skyblock/election";

const DATA_PATH = path.join(
  process.cwd(),
  "data",
  "mayors.json"
);

function cleanText(value = "") {
  return String(value)
    .replace(/§[0-9A-FK-OR]/gi, "")
    .trim();
}

function emptyMayorRecord() {
  return {
    perks: [],
    lastSeenYear: null,
    updatedAt: null,
    isCurrentMayor: false,
    lastBecameMayorAt: null,
    lastMayorEndedAt: null
  };
}

function normalizeMayorRecord(record) {
  if (Array.isArray(record)) {
    return {
      ...emptyMayorRecord(),
      perks: record
    };
  }

  return {
    ...emptyMayorRecord(),
    ...(record || {}),
    perks: Array.isArray(record?.perks)
      ? record.perks
      : []
  };
}

function readDatabase() {
  if (!fs.existsSync(DATA_PATH)) {
    return {
      _meta: {
        currentMayor: null,
        lastCheckedAt: null
      }
    };
  }

  return JSON.parse(
    fs.readFileSync(DATA_PATH, "utf8")
  );
}

function ensureMayor(database, name) {
  database[name] = normalizeMayorRecord(
    database[name]
  );

  return database[name];
}

async function updateElection() {
  const response = await fetch(API_URL, {
    headers: {
      "User-Agent": "sbelection-github-action"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Hypixel API returned ${response.status}`
    );
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(
      data.cause || "Hypixel API request failed"
    );
  }

  const database = readDatabase();
  const checkedAt = new Date().toISOString();

  database._meta = {
    currentMayor:
      database._meta?.currentMayor || null,
    lastCheckedAt: checkedAt
  };

  const currentMayorName = cleanText(
    data.mayor?.name || ""
  );

  const previousMayorName =
    database._meta.currentMayor;

  if (
    currentMayorName &&
    currentMayorName !== previousMayorName
  ) {
    if (previousMayorName) {
      const previousMayor = ensureMayor(
        database,
        previousMayorName
      );

      previousMayor.isCurrentMayor = false;
      previousMayor.lastMayorEndedAt = checkedAt;
    }

    for (const name of Object.keys(database)) {
      if (name === "_meta") {
        continue;
      }

      ensureMayor(database, name)
        .isCurrentMayor = false;
    }

    const currentMayor = ensureMayor(
      database,
      currentMayorName
    );

    currentMayor.isCurrentMayor = true;
    currentMayor.lastBecameMayorAt = checkedAt;
    currentMayor.lastMayorEndedAt = null;

    database._meta.currentMayor =
      currentMayorName;

    console.log(
      previousMayorName
        ? `Mayor changed from ${previousMayorName} to ${currentMayorName}.`
        : `Started tracking current mayor ${currentMayorName}.`
    );
  } else if (currentMayorName) {
    const currentMayor = ensureMayor(
      database,
      currentMayorName
    );

    currentMayor.isCurrentMayor = true;
  }

  const election =
    data.election || data.current || {};

  const candidates =
    Array.isArray(election.candidates)
      ? election.candidates
      : [];

  for (const candidate of candidates) {
    const name = cleanText(
      candidate.name ||
      candidate.key ||
      ""
    );

    if (!name) {
      continue;
    }

    const record = ensureMayor(
      database,
      name
    );

    record.perks = Array.isArray(
      candidate.perks
    )
      ? candidate.perks.map(perk => ({
          name: cleanText(
            perk.name || "Unknown perk"
          ),
          description: cleanText(
            perk.description ||
            "No description available."
          ),
          minister: Boolean(perk.minister)
        }))
      : [];

    record.lastSeenYear =
      election.year ?? null;

    record.updatedAt = checkedAt;
  }

  fs.mkdirSync(
    path.dirname(DATA_PATH),
    { recursive: true }
  );

  fs.writeFileSync(
    DATA_PATH,
    `${JSON.stringify(database, null, 2)}\n`,
    "utf8"
  );

  console.log(
    candidates.length
      ? `Saved ${candidates.length} candidates and their perks.`
      : "No ongoing election. Mayor status was checked."
  );
}

updateElection().catch(error => {
  console.error(error);
  process.exit(1);
});
