const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

// Add a document to Firestore with a specified document ID
router.post('/addDocument/:docId', async (req, res) => {
  try {
    const docId = req.params.docId;
    const data = req.body;

    if (!docId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    const docRef = admin.firestore().collection('group-collection').doc(docId);
    await docRef.set(data);

    res.status(201).json({ message: 'Document added successfully', documentId: docId });
  } catch (error) {
    console.error('Error adding document to Firestore:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
