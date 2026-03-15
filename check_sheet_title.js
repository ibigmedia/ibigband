import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "ibigband-cwa",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const qSheets = query(collection(db, 'sheets'), orderBy('createdAt', 'desc'), limit(10));
  const snapSheets = await getDocs(qSheets);
  snapSheets.docs.forEach(doc => {
    const title = doc.data().title;
    console.log(title);
    for (let i = 0; i < title.length; i++) {
      console.log(title[i], title.charCodeAt(i).toString(16));
    }
  });
}

check();
