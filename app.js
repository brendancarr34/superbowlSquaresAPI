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

// Handle WebSocket connection
wss.on('connection', (ws) => {
  console.log('New client connected');

  const db = admin.firestore();

const collectionRef = db.collection('group');
const unsubscribe = collectionRef.onSnapshot((snapshot) => {
  // Structure data as an array of objects with doc.id: doc.data()
  const data = snapshot.docs.map((doc) => ({
      [doc.id]: doc.data()
  }));

  ws.send(JSON.stringify(data));
});

  // Handle WebSocket close
  ws.on('close', () => {
      console.log('Client disconnected');
      unsubscribe();  // Stop listening to Firestore updates
  });
});

// const host = '10.0.0.65';
// app.listen(port, host, () => {
//   console.log(`Server is running on ${host}:${port}`);
// });