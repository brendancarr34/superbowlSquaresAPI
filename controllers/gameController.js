const express = require('express');
const admin = require('firebase-admin');
const emptyBoard = require('../data/emptyBoard');

const router = express.Router();

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
        const initials = data.initials;
        const name = data.name;

        if (!groupId) return res.status(400).json({ error: 'Group ID is required' });
        if (!initials) return res.status(400).json({ error: 'Initials are required' });
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const documentRef = admin.firestore().collection('group').doc(groupId);
        const doc = await documentRef.get();

        if (!doc.exists) return res.status(404).json({ error: 'Document not found' });

        const existingGroupData = doc.data();

        let error = false;
        const validSquares = emptyBoard;
        for (let i = 0; i < 10; i++) {
            let rowString = 'row' + i;
            for (let j = 0; j < 10; j++) {
                // console.log('rowString: '+rowString+', j: '+j);

                if (data.activeButtonData[i][j] === true && existingGroupData.gameData[rowString][j] === false) {
                    console.log('found available slot at (' + i + ',' + j + ')!')
                } else if (data.activeButtonData[i][j] === true && existingGroupData.gameData[rowString][j] === true) {
                    console.log('a selected square has already been claimed! ');
                } else {
                    // console.log('test');
                }

                if (data.activeButtonData[i][j] === true) {
                    if (existingGroupData.gameData[rowString][j] === true) {
                        error = true;
                        console.log('test2: ' + rowString + ', ' + j);
                    } else if (existingGroupData.gameData[rowString][j] === false) {
                        console.log('test3');
                        validSquares[i][j] = true;
                        console.log('test4');
                    }
                }
            }
        }

        if (error === true) {
            console.log(validSquares[1]);
            return res.status(400).json({ error: 'Oh no! Somebody stole your square! Please review your squares and try again.', validSquares: validSquares });
        } else {
            return res.status(200).json({ message: 'successfully claimed squares'});
        }
        
    } catch (error) {
        res.status(500).json({ error: 'Error - test ' + error});
    }
})

module.exports = router;
