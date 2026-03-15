const admin = require('firebase-admin');
const serviceAccount = require('/Users/hyunggonback/Downloads/ibigband-cwa-firebase-adminsdk-fbsvc-104eb08666.json');

if (!admin.apps.length) {
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
}

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('sheets').orderBy('createdAt', 'desc').limit(5).get();
  snapshot.forEach(doc => {
    const title = doc.data().title;
    console.log(title);
    let hexes = [];
    for(let i=0; i<title.length; i++) {
        hexes.push(title.charCodeAt(i).toString(16));
    }
    console.log(hexes.join(' '));
  });
  console.log('done');
  process.exit();
}

check();
