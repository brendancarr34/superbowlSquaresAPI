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
        console.log(data.activeButtonData);

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
                    // validSquares[i][j] = false;
                } else {
                    // console.log('test');
                    // validSquares[i][j] = false;
                }

                if (data.activeButtonData[i][j] === true) {
                    if (existingGroupData.gameData[rowString][j] === true) {
                        error = true;
                        console.log('test2: ' + rowString + ', ' + j);
                        validSquares[i][j] = false;
                    } else if (existingGroupData.gameData[rowString][j] === false) {
                        console.log('test3');
                        validSquares[i][j] = true;
                        console.log('test4');
                    } else {
                        validSquares[i][j] = false;
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

// POST endpoint
router.post('/api/checkData', async (req, res) => {
    try {
        console.log('/api/checkData');

        // Extract data from the request body
        const { maps } = req.body;
        console.log('requestMaps ' + maps);
        console.log('req.body ' + req.body);
        console.log('req.body:', JSON.stringify(req.body, null, 2));


        // Lookup the double array of booleans from Firestore
        const firestoreDoc = await admin.firestore().collection('group').doc('brendan11').get();
        const existingData = firestoreDoc.data().gameData;
        const gameRows = [
            existingData.row0,
            existingData.row1,
            existingData.row2,
            existingData.row3,
            existingData.row4,
            existingData.row5,
            existingData.row6,
            existingData.row7,
            existingData.row8,
            existingData.row9,
        ];

        // Accumulate valid maps
        const validMaps = [];

        // Iterate over maps in the request array
        for (const map of maps) {
            // Extract row and col values from the map
            const { row, col } = map;

            // Check if existingData[row][col] is false (valid)
            if (!gameRows[row][col]) {
                console.log(`\nValid square at row ${row} and column ${col}`);
                validMaps.push({ row, col });
            }
        }

        if (validMaps.length === maps.length) {
            // console.log('\nAll maps are valid\n');
            // return res.status(200).json({
            //     message: 'Success',
            // });
            console.log('\nAll maps are valid. Updating gameData in Firestore.\n');

            // Update gameData in Firestore
            for (const map of maps) {
                const { row, col } = map;
                existingData[`row${row}`][col] = true;
            }

            // Update Firestore document with the modified gameData
            await firestoreDoc.ref.update({ gameData: existingData });

            console.log('GameData updated in Firestore');

            return res.status(200).json({
                message: 'Success',
            });
        } else {
            console.log('Some maps are invalid! these are the valid ones:', validMaps);
            return res.status(400).json({
                error: 'Some provided maps have invalid values.',
                validMaps: validMaps,
            });
        }
    } catch (error) {
        // Handle errors and send an error response
        res.status(500).json({ error: 'Error - ' + error.message });
    }
});


// POST endpoint
router.post('/api/validateAndClaimSquares/:groupId', async (req, res) => {
    try {

        // Extract groupId
        const groupId = req.params.groupId;
        console.log('/api/validateAndClaimSquares/' + groupId);

        // Extract data from the request body
        const { maps } = req.body;
        console.log('requestMaps ' + maps);
        console.log('req.body ' + req.body);
        console.log('req.body:', JSON.stringify(req.body, null, 2));


        // Lookup the double array of booleans from Firestore
        const firestoreDoc = await admin.firestore().collection('group').doc(groupId).get();
        const existingData = firestoreDoc.data().gameData;
        const gameRows = [
            existingData.row0,
            existingData.row1,
            existingData.row2,
            existingData.row3,
            existingData.row4,
            existingData.row5,
            existingData.row6,
            existingData.row7,
            existingData.row8,
            existingData.row9,
        ];

        // Accumulate valid maps
        const validMaps = [];

        // Iterate over maps in the request array
        for (const map of maps) {
            // Extract row and col values from the map
            const { row, col } = map;

            // Check if existingData[row][col] is false (valid)
            if (!gameRows[row][col]) {
                console.log(`\nValid square at row ${row} and column ${col}`);
                validMaps.push({ row, col });
            }
        }

        if (validMaps.length === maps.length) {
            // console.log('\nAll maps are valid\n');
            // return res.status(200).json({
            //     message: 'Success',
            // });
            console.log('\nAll maps are valid. Updating gameData in Firestore.\n');

            // Update gameData in Firestore
            for (const map of maps) {
                const { row, col } = map;
                existingData[`row${row}`][col] = true;
            }

            // Update Firestore document with the modified gameData
            await firestoreDoc.ref.update({ gameData: existingData });

            console.log('GameData updated in Firestore');

            return res.status(200).json({
                message: 'Success',
            });
        } else {
            console.log('Some maps are invalid! these are the valid ones:', validMaps);
            return res.status(400).json({
                error: 'Some provided maps have invalid values.',
                validMaps: validMaps,
            });
        }
    } catch (error) {
        // Handle errors and send an error response
        res.status(500).json({ error: 'Error - ' + error.message });
    }
});

// POST endpoint
router.post('/api/validateAndClaimSquaresV2/:groupId', async (req, res) => {
    try {

        // Extract groupId
        const groupId = req.params.groupId;
        console.log('/api/validateAndClaimSquaresV2/' + groupId);

        // Extract data from the request body
        const { maps } = req.body;
        const { initials } = req.body;
        const { playerName } = req.body;

        // Lookup the double array of booleans from Firestore
        const firestoreDoc = await admin.firestore().collection('group').doc(groupId).get();
        const existingData = firestoreDoc.data().gameData;
        const gameRows = [
            existingData.row0,
            existingData.row1,
            existingData.row2,
            existingData.row3,
            existingData.row4,
            existingData.row5,
            existingData.row6,
            existingData.row7,
            existingData.row8,
            existingData.row9,
        ];

        // Accumulate valid maps
        const validMaps = [];

        // Iterate over maps in the request array
        for (const map of maps) {
            // Extract row and col values from the map
            const { row, col } = map;

            // Check if existingData[row][col] is false (valid)
            if (!gameRows[row][col]) {
                console.log(`\nValid square at row ${row} and column ${col}`);
                validMaps.push({ row, col });
            }
        }

        if (validMaps.length === maps.length) {
            // console.log('\nAll maps are valid\n');
            // return res.status(200).json({
            //     message: 'Success',
            // });
            console.log('\nAll maps are valid. Updating gameData in Firestore.\n');

            // Update gameData in Firestore
            for (const map of maps) {
                const { row, col } = map;
                existingData[`row${row}`][col] = true;
                existingData[`row${row}_players`][col] = initials;
            }

            // Update Firestore document with the modified gameData
            await firestoreDoc.ref.update({ gameData: existingData });

            console.log('GameData updated in Firestore');

            return res.status(200).json({
                message: 'Success',
            });
        } else {
            console.log('Some maps are invalid! these are the valid ones:', validMaps);
            return res.status(400).json({
                error: 'Some provided maps have invalid values.',
                validMaps: validMaps,
            });
        }
    } catch (error) {
        // Handle errors and send an error response
        res.status(500).json({ error: 'Error - ' + error.message });
    }
});

// POST endpoint
router.post('/api/validateAndClaimSquaresV3/:groupId', async (req, res) => {
    try {

        // Extract groupId
        const groupId = req.params.groupId;
        console.log('/api/validateAndClaimSquaresV3/' + groupId);

        console.log('req.body: ' + JSON.stringify(req.body));

        // Extract data from the request body
        const { maps } = req.body;
        const { initials } = req.body;
        const requestInitials = initials;
        const { playerName } = req.body;
        console.log('playerName: ' + playerName)

        // Lookup the double array of booleans from Firestore
        const firestoreDoc = await admin.firestore().collection('group').doc(groupId).get();
        const existingData = firestoreDoc.data().gameData;
        const gameRows = [
            existingData.row0,
            existingData.row1,
            existingData.row2,
            existingData.row3,
            existingData.row4,
            existingData.row5,
            existingData.row6,
            existingData.row7,
            existingData.row8,
            existingData.row9,
        ];

        // Accumulate valid maps
        const validMaps = [];

        // Iterate over maps in the request array
        for (const map of maps) {
            // Extract row and col values from the map
            const { row, col } = map;

            // Check if existingData[row][col] is false (valid)
            if (!gameRows[row][col]) {
                console.log(`\nValid square at row ${row} and column ${col}`);
                validMaps.push({ row, col });
            }
        }

        if (validMaps.length === maps.length) {
            // console.log('\nAll maps are valid\n');
            // return res.status(200).json({
            //     message: 'Success',
            // });
            console.log('\nAll maps are valid. Updating gameData in Firestore.\n');

            // Update gameData in Firestore
            for (const map of maps) {
                const { row, col } = map;
                existingData[`row${row}`][col] = true;
                existingData[`row${row}_players`][col] = initials;
            }

            const existingPlayers = firestoreDoc.data().players;

            let initialsExist = false;

            existingPlayers.forEach(map => {
                // Extract 'initials' and 'playerName' from each map
                const { initials, playerName } = map;
                console.log('initials, name: ' + initials + ', ' + playerName);
                // Add the entry to the initialsMap
                console.log('existing: ' + initials);
                console.log('initials: ' + requestInitials);
                if (initials == requestInitials) {
                    initialsExist = true;
                }
            });

            if (initialsExist) {
                return res.status(400).json({
                    error: 'initials already exist'
                });
            }

            existingPlayers.push({initials : initials, playerName : playerName})

            // Update Firestore document with the modified gameData
            await firestoreDoc.ref.update({ gameData: existingData });

            await firestoreDoc.ref.update({ players : existingPlayers})

            console.log('GameData updated in Firestore');

            return res.status(200).json({
                message: 'Success',
            });
        } else {
            console.log('Some maps are invalid! these are the valid ones:', validMaps);
            return res.status(400).json({
                error: 'Some provided maps have invalid values.',
                validMaps: validMaps,
            });
        }
    } catch (error) {
        // Handle errors and send an error response
        res.status(500).json({ error: 'Error - ' + error.message });
    }
});

module.exports = router;
