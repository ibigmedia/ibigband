const admin = require('firebase-admin');

const serviceAccount = require('/Users/hyunggonback/Downloads/ibigband-cwa-firebase-adminsdk-fbsvc-104eb08666.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function makeAdmin() {
  const uid = 'z92sZyFUVpXKCRAg7lGjrphB7Uq1'; // ibigmedia@gmail.com 아이디
  try {
    await db.collection('users').doc(uid).set({
      role: 'admin',
      updatedAt: Date.now()
    }, { merge: true });
    console.log('Success: ibigmedia@gmail.com is now an admin');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

makeAdmin();
