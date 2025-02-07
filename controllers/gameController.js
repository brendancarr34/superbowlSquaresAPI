const express = require('express');
const admin = require('firebase-admin');
const emptyBoard = require('../data/emptyBoard');

const router = express.Router();

// get game data for group ID
router.get('/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        console.log(groupId);

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

router.get('/auth-admin/:groupId/:userInputAdminPassword', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userInputAdminPassword = req.params.userInputAdminPassword;

        console.log('groupId: ' + groupId);
        console.log('userInputAdminPassword: ' + userInputAdminPassword);

        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }

        if (!userInputAdminPassword) {
            return res.status(400).json({ error: 'userInputAdminPassword is required' });
        }

        const documentRef = admin.firestore().collection('group').doc(groupId);

        const doc = await documentRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Document not found for groupId: ' + groupId });
        }

        const data = doc.data();
        const adminPassword = data.adminPassword;

        if (!adminPassword || adminPassword == '')
        {
            return res.json({auth: true});
        }

        if (userInputAdminPassword != adminPassword)
        {
            return res.status(400).json({ error: 'Incorrect admin password' });
        }

        return res.json({auth: true});
    }
    catch (error)
    {
        console.error('Error looking up document:', error);
        return res.status(500).send('Error looking up document');
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

        // console.log('req.body: ' + JSON.stringify(req.body));

        // Extract data from the request body
        const { maps } = req.body;
        const { initials } = req.body;
        const requestInitials = initials;
        const { playerName } = req.body;
        console.log('adding squares for playerName: ' + playerName + ', initials: ' + initials);

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
                // console.log(`\nValid square at row ${row} and column ${col}`);
                validMaps.push({ row, col });
            }
        }

        if (validMaps.length === maps.length) {
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
                const { initials } = map;
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

            await firestoreDoc.ref.update({ players : existingPlayers});

            let squaresClaimed = true;
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    if (existingData[`row${i}`][j] == false) {
                        squaresClaimed = false;
                    }
                }
            }

            // console.log('allSquaresClaimed: ' + squaresClaimed);

            if (squaresClaimed) {
                await firestoreDoc.ref.update({ allSquaresClaimed : true });
            }

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
router.post('/api/validateAndClaimSquaresV4/:groupId', async (req, res) => {
    try {
        // Extract groupId
        const groupId = req.params.groupId;
        console.log('/api/validateAndClaimSquaresV4/' + groupId);

        // console.log('req.body: ' + JSON.stringify(req.body));

        // Extract data from the request body
        const { maps } = req.body;
        const { initials } = req.body;
        const requestInitials = initials;
        const { playerName } = req.body;
        const { color } = req.body;
        console.log('adding squares for playerName: ' + playerName + ', initials: ' + initials + ', color: ' + color);

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
                // console.log(`\nValid square at row ${row} and column ${col}`);
                validMaps.push({ row, col });
            }
        }

        if (validMaps.length === maps.length) {
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
                const { initials } = map;
                if (initials == requestInitials) {
                    initialsExist = true;
                }
            });
            if (initialsExist) {
                return res.status(400).json({
                    error: 'initials already exist'
                });
            }

            // Update Firestore document with the modified gameData
            await firestoreDoc.ref.update({ gameData: existingData });

            existingPlayers.push({initials : initials, playerName : playerName, squaresClaimed: maps.length});
            await firestoreDoc.ref.update({ players : existingPlayers});

            const existingColors = firestoreDoc.data().colorData;
            existingColors.push({initials : initials, color : color})
            await firestoreDoc.ref.update({ colorData: existingColors});
            // await firestoreDoc.ref.update({colorData : {initials : initials, color : color}});

            let squaresClaimed = true;
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    if (existingData[`row${i}`][j] == false) {
                        squaresClaimed = false;
                    }
                }
            }

            // console.log('allSquaresClaimed: ' + squaresClaimed);

            if (squaresClaimed) {
                await firestoreDoc.ref.update({ allSquaresClaimed : true });
            }

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

// Endpoint to handle POST request for setting numbers with groupName in the URL
router.post('/api/setNumbers/:groupName', async (req, res) => {
    const groupName = req.params.groupName;
    const topNumbers = req.body.topNumbers;
    const sideNumbers = req.body.sideNumbers;

    console.log('test');

    // Check if groupName, topNumbers, and sideNumbers are provided
    if (!groupName || !topNumbers || !sideNumbers) {
        return res.status(400).json({ message: 'groupName, topNumbers, and sideNumbers are required.' });
    }

    // Check if topNumbers and sideNumbers arrays have a length of 10
    if (topNumbers.length !== 10 || sideNumbers.length !== 10) {
        return res.status(400).json({ message: 'topNumbers and sideNumbers arrays must have a length of 10.' });
    }

    function convertSetToIntegers(set) {
        return new Set([...set].map(item => parseInt(item, 10)));
    }

    const firestoreDoc = await admin.firestore().collection('group').doc(groupName).get();

    // Check for repeating numbers in topNumbers and sideNumbers
    const topNumbersSet = new Set(topNumbers);
    console.log(convertSetToIntegers(topNumbers));
    const sideNumbersSet = new Set(sideNumbers);
    if (convertSetToIntegers(topNumbers).size !== topNumbers.length || convertSetToIntegers(sideNumbers).size !== sideNumbers.length) {
        if (topNumbersSet.size == 1 && topNumbersSet.has('?') && sideNumbersSet.size == 1 && sideNumbersSet.has('?'))
        {
            await firestoreDoc.ref.update({ topNumbers: topNumbers });
            await firestoreDoc.ref.update({ sideNumbers: sideNumbers });
            await firestoreDoc.ref.update({ numbersSet: false });
        
            res.json({ message: 'Numbers reset successfully.' });
        }
        else
        {
            return res.status(400).json({ message: 'One of the rows contains a repeating number.' });
        }
    }
    else
    {
        await firestoreDoc.ref.update({ topNumbers: topNumbers });
        await firestoreDoc.ref.update({ sideNumbers: sideNumbers });
        await firestoreDoc.ref.update({ numbersSet: true });
    
        res.json({ message: 'Data updated successfully.' });
    }
});

// Endpoint to handle POST request for setting teams with groupName in the URL
router.post('/api/setTeams/:groupName', async (req, res) => {
    const groupName = req.params.groupName;
    const topTeam = req.body.topTeam;
    const sideTeam = req.body.sideTeam;

    // Check if groupName, topTeam, and sideTeam are provided
    if (!groupName || !topTeam || !sideTeam) {
        return res.status(400).json({ message: 'groupName, topTeam, and sideTeam are required.' });
    }

    const firestoreDoc = await admin.firestore().collection('group').doc(groupName).get();

    // Update teams data in Firestore as a map and set teamsSet to true
    await firestoreDoc.ref.update({
        teams: {
            top: topTeam,
            side: sideTeam
        },
        teamsSet: true
    });

    res.json({ message: 'Teams updated successfully.' });
});

// POST endpoint to add preferences to a Firestore document by groupId
router.post('/api/setPreferences/:groupId', async (req, res) => {
    console.log('hit setPreferences endpoint');
    try {
        // Extract groupId from the URL
        const groupId = req.params.groupId;
        console.log('/api/setPreferences/' + groupId);

        // Extract data from the request body
        const { autoSetNumbers } = req.body;

        // Check if autoSetNumbers is provided
        if (autoSetNumbers === undefined || autoSetNumbers === null) {
            return res.status(400).json({ error: 'autoSetNumbers is required.' });
        }

        // Lookup the Firestore document by groupId
        const firestoreDoc = await admin.firestore().collection('group').doc(groupId).get();

        // Update preferences data in Firestore
        await firestoreDoc.ref.update({
            preferences: {
                autoSetNumbers: autoSetNumbers
            }
        });

        // Return success response
        return res.status(200).json({
            message: 'Preferences updated successfully.',
        });
    } catch (error) {
        // Handle errors and send an error response
        res.status(500).json({ error: 'Error - ' + error.message });
    }
});

router.post('/api/ledger/:groupId', async (req, res) => {
    try {
        console.log('hit ledger endpoint');
        const { groupId } = req.params;
        const  ledger  = req.body;

        console.log(groupId);

        // Validate request body
        if (!Array.isArray(ledger) || !ledger.every(item =>
            typeof item.label === 'string' &&
            typeof item.paid === 'boolean' &&
            typeof item.notes === 'string'
        )) {
            console.log("Invalid ledger format");
            return res.status(400).json({ error: "Invalid ledger format" });
        }

        // Reference to the Firestore document
        const groupRef = admin.firestore().collection('group').doc(groupId);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Get existing ledger or initialize
        const existingLedger = groupDoc.data().ledger || [];

        console.log(existingLedger);

        // Merge or add new entries
        ledger.forEach(newEntry => {
            const existingEntry = existingLedger.find(entry => entry.label === newEntry.label);
            if (existingEntry) {
                existingEntry.paid = newEntry.paid;
                existingEntry.notes = newEntry.notes;
            } else {
                existingLedger.push(newEntry);
            }
        });

        console.log(existingLedger);

        // Update Firestore document
        await groupRef.update({ ledger: existingLedger });

        console.log('successfully updated ledger');

        res.json({ message: "Ledger updated successfully", ledger: existingLedger });
    } catch (error) {
        console.error("Error updating ledger:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;
