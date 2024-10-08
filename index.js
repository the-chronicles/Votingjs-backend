const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const uuid = require('uuid');

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use(express.json());

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

// app.post('/register', (req, res) => {
//     const { name, age } = req.body;
//     if (age < 18) {
//         res.send({ success: false, message: 'You must be at least 18 years old to vote.' });
//     } else {
//         const voter = { id: uuid.v4(), name, age };
//         voters.push(voter);
//         res.send({ success: true, voter });
//     }
// });

app.post('/register', async (req, res) => {
    const { name, age } = req.body;

    if (age < 18) {
        return res.json({ success: false, message: 'You must be 18 or older to vote.' });
    }

    // Save voter to database and generate a token/id
    const voter = await saveVoterToDatabase(name, age);
    res.json({ success: true, voter });
});

// app.post('/login', (req, res) => {
//     const { name } = req.body;
//     const voter = voters.find(v => v.name === name);
//     if (voter) {
//         res.send({ success: true, voter });
//     } else {
//         res.send({ success: false });
//     }
// });


app.post('/login', async (req, res) => {
    const { name } = req.body;

    // Find voter in database
    const voter = await findVoterByName(name);
    if (!voter) {
        return res.json({ success: false, message: 'Voter not found.' });
    }

    res.json({ success: true, voter });
});


app.get('/candidates', (req, res) => {
    res.send(candidates);
});

// app.post('/biometric-vote', (req, res) => {
//     const { voterId, candidateId, biometricData } = req.body;
//     // Verify biometric data (simulated)
//     const isVerified = biometricData === 'biometric-data'; // Replace with actual verification logic

//     if (isVerified) {
//         if (votes[voterId]) {
//             res.send({ success: false, message: 'You have already voted.' });
//         } else {
//             votes[voterId] = candidateId;
//             res.send({ success: true });
//         }
//     } else {
//         res.send({ success: false, message: 'Biometric verification failed.' });
//     }
// });



app.post('/biometric-vote', (req, res) => {
    const { voterId, candidateId, biometricData } = req.body;

    // Dummy biometric check (replace with actual biometric check)
    if (biometricData !== 'dummy-biometric-data') {
        return res.json({ success: false, message: 'Biometric verification failed.' });
    }

    const voter = voters.find(v => v.id === voterId);
    if (!voter) {
        return res.json({ success: false, message: 'Voter not found.' });
    }

    if (voter.hasVoted) {
        return res.json({ success: false, message: 'You have already voted.' });
    }

    // Record the vote (this is just a placeholder; in a real app, you would handle vote recording differently)
    voter.hasVoted = true;

    res.json({ success: true });
});


app.get('/results', (req, res) => {
    const results = candidates.map(candidate => {
        const voteCount = Object.values(votes).filter(vote => vote === candidate.id).length;
        return { ...candidate, voteCount };
    });
    res.send(results);
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
