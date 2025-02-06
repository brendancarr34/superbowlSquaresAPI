const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

router.get('/:submittedBetaPassword', async (req, res) => {
    let submittedBetaPassword = '';
    try {
        submittedBetaPassword = req.params.submittedBetaPassword;

        if (!submittedBetaPassword) {
            return res.status(400).json({ error: 'Beta access password is required.' });
        }

        const documentRef = admin.firestore().collection('beta-access-password').doc(submittedBetaPassword);

        const doc = await documentRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Invalid beta password' });
        }

        res.json(doc.data());
    }
    catch (error)
    {
        console.error('Error checking submitted beta password: ' + submittedBetaPassword);
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.get('/add/:newBetaPassword/:godPassword', async (req, res) => {
    console.log('hit add beta password...');
    let newBetaPassword = '';
    let godPassword = '';
    try {
        newBetaPassword = req.params.newBetaPassword;
        if (!newBetaPassword) {
            return res.status(400).json({ error: 'New beta password is required.' });
        }
        godPassword = req.params.godPassword;
        if (!godPassword) {
            return res.status(400).json({ error: 'God password is required.' });
        }
        if (godPassword != 'brendan-god-password') {
            return res.status(400).json({ error: 'God password is incorrect.' });
        }
        console.log(newBetaPassword);
        console.log(godPassword);

        const docRef = admin.firestore().collection('beta-access-password').doc(newBetaPassword);

        docRef.create({})
            .then(() => {
                console.log('Document added successfully.');
                firestoreMessage = 'Document added successfully.';
                res.status(201).json({ message: firestoreMessage, documentId: newBetaPassword });
            })
            .catch(error => {
                if (error.code === 6) {
                    // Document already exists, handle accordingly
                    console.log('Document already exists.');
                    firestoreMessage = "beta password '" + newBetaPassword + "' already exists.";
                    res.status(400).json({ error: firestoreMessage });
                } else {
                    firestoreMessage = 'Error adding document:' + error;
                    res.status(400).json({ error: firestoreMessage });
                }
            });
    }
    catch (error)
    {
        console.error('Error checking submitted beta password: ' + newBetaPassword);
        res.status(500).json({ error: 'Internal server error' });
    }
})


module.exports = router;