const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Fido2Lib } = require("fido2-lib");
const crypto = require("crypto");
const base64url = require("base64url");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// In-memory storage
let voters = [];
let candidates = [
  { id: "candidate-1", name: "Daniel John", party: "ABC", details: "Running for President" },
  { id: "candidate-2", name: "Emmanuel Kingsley", party: "XYZ", details: "Running for President" },
  { id: "candidate-3", name: "Jerry Musa", party: "ABC", details: "Running for Vice President" },
  { id: "candidate-4", name: "Buhari Tinubu", party: "XYZ", details: "Running for Vice President" },
  { id: "candidate-5", name: "Ebele Nelson", party: "ABC", details: "Running for Senate President" },
  { id: "candidate-6", name: "Emmanuel Sunday", party: "XYZ", details: "Running for Senate President" },
];
let votes = {};
let credentials = {}; // Store credentials for fingerprint registration
let challenges = {};  // Temporarily store challenges for each voter during enrollment

// Fido2Lib setup
const fido = new Fido2Lib({
  timeout: 60000,
  rpId: "localhost",
  rpName: "Voting Platform",
  challengeSize: 32,
  attestation: "none",
  cryptoParams: [-7, -257],
});

// Function to save voter to in-memory database
const saveVoterToDatabase = (name, age) => {
  const id = voters.length + 1;
  const voter = { id, name, age, hasVoted: false };
  voters.push(voter);
  return voter;
};

// Function to find voter by name
const findVoterByName = (name) => voters.find((voter) => voter.name === name);

// Function to find voter by ID
const findVoterById = (id) => voters.find((voter) => voter.id == id);

// Endpoint to register a voter
app.post("/register", async (req, res) => {
  const { name, age } = req.body;
  if (age < 18) {
    return res.json({ success: false, message: "You must be 18 or older to vote." });
  }
  const voter = await saveVoterToDatabase(name, age);
  res.json({ success: true, voter });
});

// Endpoint to login a voter
app.post("/login", async (req, res) => {
  const { name } = req.body;
  const voter = await findVoterByName(name);
  if (!voter) {
    return res.json({ success: false, message: "Voter not found." });
  }
  res.json({ success: true, voter });
});

// Endpoint to generate a challenge for fingerprint registration
app.post("/generate-challenge", (req, res) => {
  const { voterId } = req.body;
  // const challenge = base64url(Buffer.from(crypto.randomBytes(32)));
  const challenge = Buffer.from(crypto.randomBytes(32)).toString('base64');
  challenges[voterId] = challenge;
  res.json({ challenge });
});

// Endpoint to enroll fingerprint
app.post("/enroll-fingerprint", async (req, res) => {
  const { voterId, attestation } = req.body;
  try {
    const result = await fido.attestationResult(attestation, {
      challenge: challenges[voterId],
      origin: "http://localhost:3000",
    });
    const { id: credentialId, publicKey } = result.authnrData;
    credentials[voterId] = { credentialId, publicKey };
    res.json({ success: true, message: "Fingerprint enrolled successfully!" });
  } catch (error) {
    console.error("Error during fingerprint registration:", error);
    res.status(400).json({ success: false, message: "Fingerprint registration failed." });
  }
});

// Endpoint to get candidates
app.get("/candidates", (req, res) => res.send(candidates));

// Biometric vote using fingerprint authentication
app.post("/biometric-vote", async (req, res) => {
  const { voterId, candidateId, biometricData } = req.body;
  const voter = findVoterById(voterId);
  if (!voter) {
    return res.json({ success: false, message: "Voter not found." });
  }
  if (voter.hasVoted) {
    return res.json({ success: false, message: "You have already voted." });
  }
  const storedCredential = credentials[voterId];
  if (!storedCredential) {
    return res.json({ success: false, message: "No registered fingerprint found." });
  }

  try {
    const result = await fido.assertionResult(biometricData, {
      challenge: challenges[voterId],
      origin: "http://localhost:3000",
      publicKey: storedCredential.publicKey,
    });

    if (result.audit.complete) {
      voter.hasVoted = true;
      votes[candidateId] = (votes[candidateId] || 0) + 1;
      res.json({ success: true, message: "Vote recorded successfully" });
    } else {
      res.json({ success: false, message: "Biometric authentication failed." });
    }
  } catch (error) {
    console.error("Error during fingerprint authentication:", error);
    res.status(400).json({ success: false, message: "Error during fingerprint authentication." });
  }
});

// Endpoint to get voting results
app.get("/results", (req, res) => {
  const results = candidates.map((candidate) => {
    const voteCount = votes[candidate.id] || 0;
    return { ...candidate, voteCount };
  });
  res.send(results);
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
