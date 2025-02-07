const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const serviceAccount = require('./superbowlsquares-db1-firebase-adminsdk-8sn7g-38bae2da58.json');
const groupController = require('./controllers/groupController'); 
const gameController = require('./controllers/gameController'); 
const betaAccessController = require('./controllers/betaAccessController');
const { WebSocketServer } = require('ws');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://superbowlsquares-db1.firebaseio.com',
});

const app = express();

app.use(cors());

const port = 3001;

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('superbowlsquares-db1 connection established!');
  });

app.use('/api/group', groupController);

app.use('/api/game', gameController);

app.use('/api/beta-access', betaAccessController);

const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });

// Attach WebSocket server to the HTTP server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New client connected');

  const db = admin.firestore();

  let unsubscribe = null; // To store the Firestore listener

  // Listen for the first message from the client (expecting the document ID)
  ws.on('message', (message) => {
    try {
      const { docId } = JSON.parse(message);

      if (!docId) {
        ws.send(JSON.stringify({ error: "Document ID is required" }));
        return;
      }

      console.log(`Listening for changes on document: ${docId}`);

      // Reference to the specific document
      const docRef = db.collection('group').doc(docId);

      // Set up Firestore listener for the specific document
      unsubscribe = docRef.onSnapshot((doc) => {
        if (doc.exists) {
          ws.send(JSON.stringify({ [doc.id]: doc.data() }));
        } else {
          ws.send(JSON.stringify({ error: "Document not found" }));
        }
      });
    } catch (error) {
      console.error("Error parsing message:", error);
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  });

  // Handle WebSocket close
  ws.on('close', () => {
    console.log('Client disconnected');
    if (unsubscribe) {
      unsubscribe(); // Stop Firestore listener
    }
  });
});

// const host = '10.0.0.65';
// app.listen(port, host, () => {
//   console.log(`Server is running on ${host}:${port}`);
// });