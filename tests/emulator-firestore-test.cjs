const fs = require('fs');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'trybe-2d135';

(async () => {
  const rules = fs.readFileSync('./firestore.rules', 'utf8');
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });

  try {
    // Create two authenticated contexts
    const alice = testEnv.authenticatedContext('alice-uid', { uid: 'alice-uid' });
    const bob = testEnv.authenticatedContext('bob-uid', { uid: 'bob-uid' });

    // As admin (privileged) create a trybe doc
    const admin = testEnv.unauthenticatedContext();
    const adminDb = admin.firestore();
    const trybeRef = adminDb.collection('trybes').doc('trybe-1');
    await trybeRef.set({
      createdBy: 'alice-uid',
      attendees: 1,
      attendeeIds: ['alice-uid'],
      eventName: 'Test Trybe',
    });
    console.log('Trybe created by admin for tests');

    // Alice should be able to write a message
    const aliceDb = alice.firestore();
    const aliceMsgRef = aliceDb.collection('trybes').doc('trybe-1').collection('messages').doc();
    await assertSucceeds(aliceMsgRef.set({ senderId: 'alice-uid', text: 'hello', createdAt: new Date() }));
    console.log('Alice can write messages: OK');

    // Bob should not be able to read messages
    const bobDb = bob.firestore();
    const bobRead = bobDb.collection('trybes').doc('trybe-1').collection('messages').get();
    await assertFails(bobRead);
    console.log('Bob cannot read messages before join: OK');

    // Add Bob to attendees (admin)
    await trybeRef.update({ attendees: 2, attendeeIds: ['alice-uid', 'bob-uid'] });
    console.log('Bob added to attendeeIds by admin');

    // Now Bob should be allowed to write/read
    const bobMsgRef = bobDb.collection('trybes').doc('trybe-1').collection('messages').doc();
    await assertSucceeds(bobMsgRef.set({ senderId: 'bob-uid', text: 'hi', createdAt: new Date() }));
    console.log('Bob can write messages after join: OK');

    const bobRead2 = bobDb.collection('trybes').doc('trybe-1').collection('messages').get();
    await assertSucceeds(bobRead2);
    console.log('Bob can read messages after join: OK');

    console.log('All tests passed');
  } catch (err) {
    console.error('Test failed', err);
  } finally {
    await testEnv.cleanup();
  }
})();
