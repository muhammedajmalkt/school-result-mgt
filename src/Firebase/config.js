// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: "AIzaSyADUFRc2Gq8WR6PeAWIKJJmn75AxzTGuXo",
//   authDomain: "school-results-d4f33.firebaseapp.com",
//   projectId: "school-results-d4f33",
//   storageBucket: "school-results-d4f33.firebasestorage.app",
//   messagingSenderId: "297487430334",
//   appId: "1:297487430334:web:4bd1baa2250d76c6d9e4ef"
// };


// const app = initializeApp(firebaseConfig);
// const firestore = getFirestore(app);
// const auth = getAuth(app); 
// export { app, firestore, auth };
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBZroHC6zu9cqk_tTgbfQSUcVmu2RyDXGA",
  authDomain: "school-mgt-c0f08.firebaseapp.com",
  projectId: "school-mgt-c0f08",
  storageBucket: "school-mgt-c0f08.appspot.com", 
  messagingSenderId: "543145962296",
  appId: "1:543145962296:web:7355e6728e67d23d0defcd"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app); 
export { app, firestore, auth };