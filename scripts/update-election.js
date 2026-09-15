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

function readDatabase() {
  if (!fs.existsSync(DATA_PATH)) {
    return {};
  }

  return JSON.parse(
    fs.readFileSync(DATA_PATH, "utf8")
  );
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

  const election = data.election || data.current || {};
  const candidates = Array.isArray(election.candidates)
    ? election.candidates
    : [];

  if (!candidates.length) {
    console.log("No ongoing election. Nothing was changed.");
    return;
  }

  const database = readDatabase();
  const updatedAt = new Date().toISOString();

  for (const candidate of candidates) {
    const name = cleanText(
      candidate.name || candidate.key || ""
    );

    if (!name) {
      continue;
    }

    const perks = Array.isArray(candidate.perks)
      ? candidate.perks.map(perk => ({
          name: cleanText(perk.name || "Unknown perk"),
          description: cleanText(
            perk.description || "No description available."
          ),
          minister: Boolean(perk.minister)
        }))
      : [];

    database[name] = {
      perks,
      lastSeenYear: election.year ?? null,
      updatedAt
    };
  }

  fs.mkdirSync(path.dirname(DATA_PATH), {
    recursive: true
  });

  fs.writeFileSync(
    DATA_PATH,
    `${JSON.stringify(database, null, 2)}\n`,
    "utf8"
  );

  console.log(
    `Saved ${candidates.length} candidates from Year ${election.year ?? "unknown"}.`
  );
}

updateElection().catch(error => {
  console.error(error);
  process.exit(1);
});
