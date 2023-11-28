const express = require('express');
const cors = require('cors');
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

app.use(cors());

const port = 3001;

// Your routes and other server logic go here

app.use(express.json());

app.get('/', (req, res) => {
    res.send('superbowlsquares-db1 connection established');
  });

app.use('/api/group', groupController);

app.use('/api/game', gameController);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });