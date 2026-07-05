import 'dotenv/config';
import { firestore } from '../src/server/db';

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is required.');
  }

  await firestore.collection('appSetup').doc('storyline').set({
    projectId,
    collections: ['users', 'userEmails', 'sessions', 'decks', 'deckShares'],
    updatedAt: new Date(),
  }, { merge: true });

  console.log(`Firebase Firestore setup verified for project ${projectId}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
