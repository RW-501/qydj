
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// 🔐 Config
const firebaseConfig = {
    apiKey: "AIzaSyCzTA2ajYdy64FWHa2jW5R5TX1XzBdrSdY",
    authDomain: "qydj-65f76.firebaseapp.com",
    projectId: "qydj-65f76",
    storageBucket: "qydj-65f76.firebasestorage.app",
    messagingSenderId: "485183277679",
    appId: "1:485183277679:web:d633e3f2b9136874dc9b9a",
    measurementId: "G-G7F0PJ5V5H"
  };

// 🧩 Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Admin Whitelist
const allowedEmails = ["admin@example.com"];
const allowedPhones = ["+12345678900"];

// 🔐 Auth State
onAuthStateChanged(auth, user => {
  if (user && (allowedEmails.includes(user.email) || allowedPhones.includes(user.phoneNumber))) {
    showAdminPanel();
  } else {
    logoutUser();
  }
});

function showAdminPanel() {
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("admin-panel").classList.remove("hidden");
  document.getElementById("logoutBtn").classList.remove("hidden");
  loadEvents();
}

function logoutUser() {
  signOut(auth);
  document.getElementById("auth-section").classList.remove("hidden");
  document.getElementById("admin-panel").classList.add("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");
}

// 📲 Google Login
document.getElementById("googleLogin").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!allowedEmails.includes(user.email)) {
      alert("Unauthorized email.");
      logoutUser();
    }
  } catch (error) {
    alert(error.message);
  }
});

// 📞 Phone Login
window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', { size: 'invisible' }, auth);

document.getElementById("sendCode").addEventListener("click", async () => {
  const phone = document.getElementById("phoneInput").value;
  if (!allowedPhones.includes(phone)) return alert("Unauthorized phone number.");

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
    window.confirmationResult = confirmationResult;
    document.getElementById("verifyCode").classList.remove("hidden");
    document.getElementById("verifyBtn").classList.remove("hidden");
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("verifyBtn").addEventListener("click", async () => {
  const code = document.getElementById("verifyCode").value;
  try {
    const result = await window.confirmationResult.confirm(code);
    if (!allowedPhones.includes(result.user.phoneNumber)) {
      alert("Unauthorized phone number.");
      logoutUser();
    }
  } catch (error) {
    alert("Invalid code.");
  }
});

document.getElementById("logoutBtn").addEventListener("click", logoutUser);

// 📤 Add/Update Events
document.getElementById("eventForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const location = document.getElementById("location").value;
  const date = document.getElementById("date").value;
  const tags = document.getElementById("tags").value.split(",").map(t => t.trim());
  const status = document.getElementById("status").value;
  const bannerFile = document.getElementById("bannerImage").files[0];

  let imageUrl = "";
  if (bannerFile) {
    const storageRef = ref(storage, `images/events/${title}/banner.jpg`);
    await uploadBytes(storageRef, bannerFile);
    imageUrl = await getDownloadURL(storageRef);
  }

  await addDoc(collection(db, "events"), {
    title,
    description,
    location,
    date,
    tags,
    status,
    imageUrl,
    createdAt: serverTimestamp()
  });

  alert("Event saved.");
  document.getElementById("eventForm").reset();
  loadEvents();
});

// 📋 Load Events
async function loadEvents() {
  const eventList = document.getElementById("eventList");
  eventList.innerHTML = "";
  const snapshot = await getDocs(collection(db, "events"));
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "bg-white p-4 shadow rounded";
    card.innerHTML = `
      <h4 class="font-bold">${data.title}</h4>
      <p>${data.date} – ${data.location}</p>
      <p>Status: ${data.status}</p>
      <img src="${data.imageUrl}" class="w-full h-40 object-cover my-2"/>
      <button class="bg-red-500 text-white px-3 py-1 rounded deleteBtn" data-id="${docSnap.id}">Delete</button>
    `;
    eventList.appendChild(card);
  });

  // Delete handlers
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (confirm("Delete this event?")) {
        await deleteDoc(doc(db, "events", id));
        loadEvents();
      }
    });
  });
}
