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
        console.log('GET game for group: ' + groupId);

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

        if (!groupId) return res.status(400).json({ error: 'Group ID is required' });

        const documentRef = admin.firestore().collection('group').doc(groupId);
        const doc = await documentRef.get();

        if (!doc.exists) return res.status(404).json({ error: 'Document not found' });

        const existingGroupData = doc.data();

        // console.log('row0: ' + existingGroupData.gameData.row0);
        // console.log('row0_2: ' + existingGroupData.gameData['row0']);

        // console.log('groupid: ' + groupId);
        // console.log('data: ' + data.activeButtonData);

        // console.log('activeButtonData[0]: ' + data.activeButtonData[0]);

        
        for (let i = 0; i < 10; i++) {
            const rowString = 'row' + i;
            for (let j = 0; j < 10; j++) {
                // if (activeButtonData[i][j] === true) {
                //     gameData[i][j] = true;
                //     gameNameData[i][j] = playerInitials;
                // }
                
                // console.log('gameData: ' + j + ' ' + existingGroupData.gameData[rowString][j]);
                // console.log('activeButtonData: ' + data.activeButtonData[i][j])
                // console.log('\n\n\n')
                if (data.activeButtonData[i][j] === true && existingGroupData.gameData[rowString][j] === false) {
                    console.log('found available slot at (' + i + ',' + j + ')!')
                } else if (data.activeButtonData[i][j] === true && existingGroupData.gameData[rowString][j] === true) {
                    console.log('a selected square has already been claimed! ');
                }
            }
        }

        console.log('initials: ' + data.initials);
        console.log('name: ' + data.name);
        
    } catch (error) {
        res.status(500).json({ error: 'Error' + error});
    }
})

module.exports = router;
