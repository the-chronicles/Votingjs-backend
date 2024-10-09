// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const uuid = require('uuid');

// const app = express();
// app.use(bodyParser.json());
// app.use(cors());

// app.use(express.json());

// let voters = [];
// let candidates = [
//     { id: 'candidate-1', name: 'Daniel John', party: 'ABC', details: 'Running for President' },
//     { id: 'candidate-2', name: 'Emmanuel Kingsley', party: 'XYZ', details: 'Running for President' },
//     { id: 'candidate-3', name: 'Jerry Musa', party: 'ABC', details: 'Running for Vice President' },
//     { id: 'candidate-4', name: 'Buhari Tinubu', party: 'XYZ', details: 'Running for Vice President' },
//     { id: 'candidate-5', name: 'Ebele Nelson', party: 'ABC', details: 'Running for Senate President' },
//     { id: 'candidate-6', name: 'Emmanuel Sunday', party: 'XYZ', details: 'Running for Senate President' },
// ];
// let votes = {};

// // Function to save voter to in-memory database
// const saveVoterToDatabase = (name, age) => {
//     const id = voters.length + 1;
//     const voter = { id, name, age, hasVoted: false };
//     voters.push(voter);
//     return voter;
// };

// // Function to find voter by name
// const findVoterByName = (name) => {
//     return voters.find(voter => voter.name === name);
// };


// app.post('/register', async (req, res) => {
//     const { name, age } = req.body;

//     if (age < 18) {
//         return res.json({ success: false, message: 'You must be 18 or older to vote.' });
//     }

//     // Save voter to database and generate a token/id
//     const voter = await saveVoterToDatabase(name, age);
//     res.json({ success: true, voter });
// });




// app.post('/login', async (req, res) => {
//     const { name } = req.body;

//     // Find voter in database
//     const voter = await findVoterByName(name);
//     if (!voter) {
//         return res.json({ success: false, message: 'Voter not found.' });
//     }

//     res.json({ success: true, voter });
// });


// app.get('/candidates', (req, res) => {
//     res.send(candidates);
// });





// app.post('/biometric-vote', (req, res) => {
//     const { voterId, candidateId, biometricData } = req.body;

//     // Dummy biometric check (replace with actual biometric check)
//     if (biometricData !== 'dummy-biometric-data') {
//         return res.json({ success: false, message: 'Biometric verification failed.' });
//     }

//     const voter = voters.find(v => v.id === voterId);
//     if (!voter) {
//         return res.json({ success: false, message: 'Voter not found.' });
//     }

//     if (voter.hasVoted) {
//         return res.json({ success: false, message: 'You have already voted.' });
//     }

//     // Record the vote (this is just a placeholder; in a real app, you would handle vote recording differently)
//     voter.hasVoted = true;

//     res.json({ success: true });
// });


// app.get('/results', (req, res) => {
//     const results = candidates.map(candidate => {
//         const voteCount = Object.values(votes).filter(vote => vote === candidate.id).length;
//         return { ...candidate, voteCount };
//     });
//     res.send(results);
// });

// const PORT = 5000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
















const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Fido2Lib } = require("fido2-lib");
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// In-memory storage
let voters = [];
let candidates = [
    { id: 'candidate-1', name: 'Daniel John', party: 'ABC', details: 'Running for President' },
    { id: 'candidate-2', name: 'Emmanuel Kingsley', party: 'XYZ', details: 'Running for President' },
    { id: 'candidate-3', name: 'Jerry Musa', party: 'ABC', details: 'Running for Vice President' },
    { id: 'candidate-4', name: 'Buhari Tinubu', party: 'XYZ', details: 'Running for Vice President' },
    { id: 'candidate-5', name: 'Ebele Nelson', party: 'ABC', details: 'Running for Senate President' },
    { id: 'candidate-6', name: 'Emmanuel Sunday', party: 'XYZ', details: 'Running for Senate President' },
];
let votes = {};
let credentials = {}; // Store credentials for fingerprint registration

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
const findVoterByName = (name) => {
    return voters.find(voter => voter.name === name);
};

// Function to find voter by ID
const findVoterById = (id) => {
    return voters.find(voter => voter.id == id);
};

// Endpoint to register a voter
app.post('/register', async (req, res) => {
    const { name, age } = req.body;

    if (age < 18) {
        return res.json({ success: false, message: 'You must be 18 or older to vote.' });
    }

    const voter = await saveVoterToDatabase(name, age);
    res.json({ success: true, voter });
});

// Endpoint to login a voter
app.post('/login', async (req, res) => {
    const { name } = req.body;

    // Find voter in database
    const voter = await findVoterByName(name);
    if (!voter) {
        return res.json({ success: false, message: 'Voter not found.' });
    }

    res.json({ success: true, voter });
});

app.post('/enroll-fingerprint', (req, res) => {
    const { credential, voterId } = req.body;
  
    // Here, you would typically process the credential and save it to the database
    // For example, save it to a MongoDB collection associated with the voterId
    
    // Example response
    res.json({ success: true, message: 'Fingerprint enrolled successfully!' });
  });

// Endpoint to get candidates
app.get('/candidates', (req, res) => {
    res.send(candidates);
});

// Endpoint to generate challenge for enrollment
app.post('/generate-challenge', (req, res) => {
    const challenge = crypto.randomBytes(32).toString('base64');
    res.json({ challenge });
});

// Fingerprint Registration
app.post('/register-fingerprint', async (req, res) => {
    const { userId, attestation } = req.body;

    try {
        const result = await fido.attestationResult(attestation, { challenge: "server-challenge" });
        const { id: credentialId, publicKey } = result.authnrData;

        // Store credential for users
        credentials[userId] = { credentialId, publicKey };

        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Fingerprint registration failed.' });
    }
});

// Biometric vote using fingerprint authentication
app.post('/biometric-vote', async (req, res) => {
    const { voterId, candidateId, biometricData } = req.body;

    // Check if the voter exists
    const voter = findVoterById(voterId);
    if (!voter) {
        return res.json({ success: false, message: 'Voter not found.' });
    }

    // Check if the voter has already voted
    if (voter.hasVoted) {
        return res.json({ success: false, message: 'You have already voted.' });
    }

    // Check if the biometric data matches the registered fingerprint
    const storedCredential = credentials[voterId];
    if (!storedCredential) {
        return res.json({ success: false, message: 'No registered fingerprint found.' });
    }

    try {
        const result = await fido.assertionResult(biometricData, {
            challenge: "server-challenge",
            origin: "http://localhost:3000",
            publicKey: storedCredential.publicKey
        });

        if (result.audit.complete) {
            // Mark the voter as having voted and record the vote
            voter.hasVoted = true;
            votes[candidateId] = (votes[candidateId] || 0) + 1;

            res.json({ success: true, message: 'Vote recorded successfully' });
        } else {
            res.json({ success: false, message: 'Biometric authentication failed.' });
        }
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error during fingerprint authentication.' });
    }
});

// Endpoint to get results
app.get('/results', (req, res) => {
    const results = candidates.map(candidate => {
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
