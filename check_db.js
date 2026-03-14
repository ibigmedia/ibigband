const admin = require('firebase-admin');
const serviceAccount = require('/Users/hyunggonback/Downloads/ibigband-cwa-firebase-adminsdk-fbsvc-104eb08666.json');

if (!admin.apps.length) {
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
}

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('sheets').orderBy('createdAt', 'desc').get();
  console.log('Total sheets fetched with orderBy:', snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data().createdAt);
  })
  process.exit(0);
}

check();
