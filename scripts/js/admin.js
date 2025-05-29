import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";




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
const allowedEmails = ["1988lrp@gmail.com"];
const allowedPhones = ["+19725977878", "+12145527280"];

// 🔐 Auth State
onAuthStateChanged(auth, (user) => {
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
if (!window.recaptchaVerifier) {
  window.recaptchaVerifier = new RecaptchaVerifier(
    "recaptcha-container",
    { size: "invisible" },
    auth
  );
}

document.getElementById("sendCode").addEventListener("click", async () => {
  const phone = document.getElementById("phoneInput").value.trim();
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
  const code = document.getElementById("verifyCode").value.trim();
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
  
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
  
    try {
      const title = document.getElementById("title").value.trim();
      const description = document.getElementById("description").value.trim();
      const location = document.getElementById("location").value.trim();
      const date = document.getElementById("date").value;
      const tags = document.getElementById("tags").value
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const status = document.getElementById("status").value;
      const bannerFile = document.getElementById("bannerImage").files[0];
  
      if (!title || !description || !location || !date || !status) {
        alert("Please fill all required fields.");
        return;
      }
  
      let imageUrl = "";
      if (bannerFile) {


        try {
          const slugTitle = title.toLowerCase().replace(/\s+/g, "-");
          const storageRef = ref(storage, `images/events/${slugTitle}/banner.jpg`);

        console.log("Uploading to:", `images/events/${slugTitle}/banner.jpg`);

        console.log("File details:", bannerFile);

          await uploadBytes(storageRef, bannerFile);
          imageUrl = await getDownloadURL(storageRef);
        } catch (error) {
          console.error("Image upload error:", error);
          alert("Failed to upload image.");
        }
      }

      if (window.editingEventId) {
        const docRef = doc(db, "events", window.editingEventId);
        await updateDoc(docRef, {
          cost,
          facebookLink,
          eventbriteLink,
          otherLink,
          title,
          description,
          location,
          date,
          tags,
          status,
          imageUrl,
          updatedAt: serverTimestamp(),
        });
        alert("Event updated.");
        window.editingEventId = null;
      } else {
        await addDoc(collection(db, "events"), {
          title,
          description,
          location,
          date,
          tags,
          status,
          imageUrl,
          createdAt: serverTimestamp(),
        });
        alert("Event saved.");
      }
  
      document.getElementById("eventForm").reset();
      loadEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error saving event. Please try again.");
    } finally {
      submitBtn.disabled = false;
    }
  });
  

// 📋 Load Events
async function loadEvents() {
  const eventList = document.getElementById("eventList");
  eventList.innerHTML = "";
  const snapshot = await getDocs(collection(db, "events"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "bg-white p-4 shadow rounded mb-4";
    card.innerHTML = `
      <h4 class="font-bold">${data.title}</h4>
      <p>${data.date} – ${data.location}</p>
      <p>Status: ${data.status}</p>
      <img src="${data.imageUrl || 'https://via.placeholder.com/300x150'}" class="w-full h-40 object-cover my-2"/>
      <button class="bg-yellow-500 text-white px-3 py-1 rounded editBtn" data-id="${docSnap.id}">Edit</button>
      <button class="bg-red-500 text-white px-3 py-1 rounded deleteBtn" data-id="${docSnap.id}">Delete</button>
    `;
    eventList.appendChild(card);
  });

  // 📌 Attach Edit/Delete Listeners
  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (confirm("Delete this event?")) {
        await deleteDoc(doc(db, "events", id));
        loadEvents();
      }
    });
  });

  document.querySelectorAll(".editBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const event = snapshot.docs.find((d) => d.id === id).data();
      document.getElementById("title").value = event.title;
      document.getElementById("description").value = event.description;
      document.getElementById("location").value = event.location;
      document.getElementById("date").value = event.date;
      document.getElementById("tags").value = event.tags.join(", ");
      document.getElementById("status").value = event.status;
      window.editingEventId = id;
    });
  });
}





    function previewImage(event) {
      const input = event.target;
      const preview = document.getElementById('preview');

      if (input.files && input.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
          preview.src = e.target.result;
          preview.style.display = 'block';
        }

        reader.readAsDataURL(input.files[0]);
      }
    }