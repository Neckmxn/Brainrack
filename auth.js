import { auth } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup } from 
"https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

export function login() {
  signInWithPopup(auth, provider)
    .then(result => {
      window.location = "dashboard.html";
    })
}
