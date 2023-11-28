const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./superbowlsquares-db1-firebase-adminsdk-8sn7g-38bae2da58.json');
const groupController = require('./controllers/groupController'); 
const gameController = require('./controllers/gameController'); 

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://superbowlsquares-db1.firebaseio.com', // Replace with your project's database URL
});

const app = express();
const port = 3000;

// Your routes and other server logic go here

app.use(express.json());

app.use('/api/group', groupController);

app.use('/api/game', gameController)

/*
app.get('/', (req, res) => {
    res.send('Firebase Admin SDK initialized successfully!');
  });

app.get('/api/data', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('collection1').get();
    const data = snapshot.docs.map(doc => doc.data());
    res.json(data);
  } catch (error) {
    console.error('Error retrieving data from Firestore:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/addDocument', async (req, res) => {
    try {
      const data = req.body; // Assuming the request body contains the data for the new document
    //   res.json(data.name);
      const result = await admin.firestore().collection('collection1').add(data);
  
      res.status(201).json({ message: 'Document added successfully', documentId: result.id });
    } catch (error) {
      console.error('Error adding document to Firestore:', error);
      res.status(500).json({ error: 'Internal server error ' + error });
    }
  });

  app.post('/api/addDocument/:docId', async (req, res) => {
    try {
      const docId = req.params.docId;
      const data = req.body;
  
      if (!docId) {
        return res.status(400).json({ error: 'Document ID is required' });
      }
  
      const docRef = admin.firestore().collection('collection1').doc(docId);
      await docRef.set(data);
  
      res.status(201).json({ message: 'Document added successfully', documentId: docId });
    } catch (error) {
      console.error('Error adding document to Firestore:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

*/

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });