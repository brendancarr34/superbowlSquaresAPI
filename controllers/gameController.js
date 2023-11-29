const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

// // Add a document to Firestore with a specified document ID
// router.post('/addDocument/:docId', async (req, res) => {
//   try {
//     const docId = req.params.docId;
//     const data = req.body;

//     if (!docId) {
//       return res.status(400).json({ error: 'Document ID is required' });
//     }

//     const docRef = admin.firestore().collection('game-collection').doc(docId);
//     await docRef.set(data);

//     res.status(201).json({ message: 'Document added successfully', documentId: docId });
//   } catch (error) {
//     console.error('Error adding document to Firestore:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// get game data for group ID



router.get('/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;

        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }

        const documentRef = admin.firestore().collection('group').doc(groupId);

        const doc = await documentRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(doc.data());
    } catch (error) {
        console.error('Error retrieving gameData for group: ' + groupId);
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.post('/claimSquares/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const data = req.body;

        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }

        const documentRef = admin.firestore().collection('group').doc(groupId);

        const doc = await documentRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Document not found' });
        }

        console.log('data: ' + data);
        console.log('doc: ' + doc);
        
    } catch (error) {
        res.status(500).json({ error: 'Error' + error});
    }
})

module.exports = router;
