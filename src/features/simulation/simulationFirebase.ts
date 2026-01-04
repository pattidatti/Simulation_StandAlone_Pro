import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// --- INSTRUKSJONER ---
// 1. Gå til https://console.firebase.google.com/
// 2. Opprett et nytt prosjekt (f.eks "eiriksbok-simulering")
// 3. Gå til "Project settings" (tannhjulet) -> General -> "Your apps"
// 4. Klikk på Web-ikonet (</>) for å registrere en app
// 5. Kopier "firebaseConfig" objektet og lim det inn over det tomme objektet under:

const simulationConfig = {
    apiKey: "AIzaSyBU11CvtAaUkADomFxcMuN6fH9ipx-VtAs",
    authDomain: "eiriksbok-simuleringfeudal.firebaseapp.com",
    databaseURL: "https://eiriksbok-simuleringfeudal-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "eiriksbok-simuleringfeudal",
    storageBucket: "eiriksbok-simuleringfeudal.firebasestorage.app",
    messagingSenderId: "772081963542",
    appId: "1:772081963542:web:05edb87535f629fd36db37",
    measurementId: "G-NDR8LNVQNX"
};

// Initialize the distinct simulation app
const simApp = initializeApp(simulationConfig, "simulationApp"); // "simulationApp" name is important to keep it separate

// Export the specific instances
export const simulationDb = getDatabase(simApp);
export const simulationAuth = getAuth(simApp);

export default simApp;
