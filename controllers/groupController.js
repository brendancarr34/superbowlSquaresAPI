const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

// Add a group to Firestore with a specified group ID
router.post('/add/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const data = req.body;
  
        if (!groupId) {
        return res.status(400).json({ error: 'group ID is required' });
        }
  
        const docRef = admin.firestore().collection('group').doc(groupId);

        var firestoreMessage = '';

        docRef.create(data)
            .then(() => {
                firestoreMessage = 'Document added successfully.';
                res.status(201).json({ message: firestoreMessage, documentId: groupId });
            })
            .catch(error => {
                if (error.code === 6) {
                    // Document already exists, handle accordingly
                    console.log('Document already exists.');
                    firestoreMessage = 'Document already exists.';
                    res.status(500).json({ error: firestoreMessage });
                } else {
                    firestoreMessage = 'Error adding document:' + error;
                    res.status(500).json({ error: firestoreMessage });
                }
            });
    } catch (error) {
        console.error('Error adding document to Firestore:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
  });

module.exports = router;