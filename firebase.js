<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB5_8wwx9vdTzT5ftb_8mxeu2xVgOVn1Lw",
  authDomain: "login-6ed5a.firebaseapp.com",
  projectId: "login-6ed5a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
</script>
