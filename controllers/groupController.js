const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

// Add a group to Firestore with a specified group ID
router.post('/add/:groupId', async (req, res) => {

    let groupId = ""
    try {
        groupId = req.params.groupId;
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
                    firestoreMessage = 'group with name ' + groupId + ' already exists.';
                    res.status(400).json({ error: firestoreMessage });
                } else {
                    firestoreMessage = 'Error adding document:' + error;
                    res.status(400).json({ error: firestoreMessage });
                }
            });
    } catch (error) {
        console.error('Error adding document to Firestore:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
  });

router.post('/api/deleteDocument', async (req, res) => {
    try {
        // Extract the document name from the request body
        const { documentName } = req.body;
    
        if (!documentName) {
          return res.status(400).json({ error: 'Document name is required' });
        }
    
        // Get a reference to the Firestore document
        const docRef = admin.firestore().collection('group').doc(documentName);
    
        // Check if the document exists
        const docSnapshot = await docRef.get();
        if (!docSnapshot.exists) {
          return res.status(404).json({ error: 'Document not found' });
        }
    
        // Delete the document
        await docRef.delete();
    
        // Return success response
        return res.status(200).json({ message: 'Document deleted successfully' });
      } catch (error) {
        console.error('Error deleting document:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
});

// POST endpoint to delete Firestore documents by document name
router.post('/api/deleteDocuments', async (req, res) => {
    try {
        console.log('/api/deleteDocuments');

        // Extract document names from the request body
        const { documentNames } = req.body;
        console.log('Document names to delete: ', documentNames);

        // Delete each document in the list
        const db = admin.firestore();
        const deletionResults = [];

        for (const documentName of documentNames) {
            try {
                const documentRef = db.collection('group').doc(documentName);
                const snapshot = await documentRef.get();

                if (snapshot.exists) {
                    await documentRef.delete();
                    deletionResults.push({ documentName: documentName, deleted: true });
                    console.log(`Document '${documentName}' successfully deleted.`);
                } else {
                    deletionResults.push({ documentName: documentName, deleted: false, error: 'Document not found' });
                    console.log(`Document '${documentName}' not found.`);
                }
            } catch (error) {
                deletionResults.push({ documentName: documentName, deleted: false, error: error.message });
                console.error(`Error deleting document '${documentName}':`, error);
            }
        }

        return res.status(200).json({
            message: 'Deletion process completed',
            deletionResults: deletionResults
        });
    } catch (error) {
        // Handle errors and send an error response
        res.status(500).json({ error: 'Error - ' + error.message });
    }
});

router.get('/api/joinGroup/:groupId', async (req, res) => {
    
    let groupId = ""
    try {
        groupId = req.params.groupId;
        console.log(groupId)

        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }

        const documentRef = admin.firestore().collection('group').doc(groupId);

        const doc = await documentRef.get();

        if (!doc.exists) {
            console.log('doc does not exist');
            return res.status(404).json({ error: 'Document not found' });
        }

        return res.json(doc.data());
    } catch (error) {
        console.error('Error retrieving gameData for group: ' + groupId);
        return res.status(500).json({ error: 'Internal server error' });
    }
})

router.post('/api/joinGroup/:groupId', async (req, res) => {
    
    let groupId = ""
    try {
        groupId = req.params.groupId;
        console.log(groupId)

        const { submittedPassword } = req.body;

        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }

        const documentRef = admin.firestore().collection('group').doc(groupId);

        const doc = await documentRef.get();

        if (!doc.exists) {
            console.log('group does not exist');
            return res.status(404).json({ error: 'Document not found' });
        }

        const groupPassword = doc.data().preferences.groupPassword;

        if (submittedPassword != groupPassword) {
            console.log('password is incorrect');
            return res.status(404).json({ error: 'Incorrect password' });
        }

        return res.json(doc.data());
    } catch (error) {
        console.error('Error retrieving gameData for group: ' + groupId);
        return res.status(500).json({ error: 'Internal server error' });
    }
})

router.get('/api/allGroups', async (req, res) => {
    try {
        const collectionRef = admin.firestore().collection('group'); // Replace 'your_collection' with your collection name
        const snapshot = await collectionRef.get();
    
        const documentNames = [];
        snapshot.forEach(doc => {
          documentNames.push(doc.id);
        });
    
        res.json(documentNames);
      } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).send('Error fetching documents');
      }
})

// Endpoint to look up a document by name in the 'group' collection
router.get('/api/hasPassword/:groupId', async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const docRef = admin.firestore().collection('group').doc(groupId);
      const doc = await docRef.get();
  
      if (!doc.exists) {
        return res.status(404).json({ error: 'Document not found' });
      }
  
      const data = doc.data();
      if (data.preferences.groupPassword != '') {
        return res.json(true);
      }
  
      return res.json(false);
    } catch (error) {
      console.error('Error looking up document:', error);
      res.status(500).send('Error looking up document');
    }
  });

module.exports = router;