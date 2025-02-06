const express = require('express');
const admin = require('firebase-admin');
// const emptyBoard = require('../data/emptyBoard');

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


module.exports = router;