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
  doc, query, orderBy, 
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






function formatFirebaseDate(dateInput) {
  // Check if it's a Firestore Timestamp object
  if (typeof dateInput?.toDate === 'function') {
    return dateInput.toDate().toLocaleString(); // Convert and format
  }

  // If it's already a JS Date or ISO string
  try {
    return new Date(dateInput).toLocaleString();
  } catch (e) {
    console.warn("Invalid date input:", dateInput);
    return "Invalid Date";
  }
}





// 📤 Add/Update Events
document.getElementById("eventForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
  
    try {
      const title = document.getElementById("title").value.trim();
      const description = document.getElementById("description").value.trim();
      const location = document.getElementById("location").value.trim();

const formDate = document.getElementById("date").value;
const eventDate = new Date(formDate);

// Validate date
if (!formDate || isNaN(eventDate.getTime())) {
  alert("Please enter a valid date and time.");
  submitBtn.disabled = false;
  return;
}

      const tags = document.getElementById("tags").value
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const status = document.getElementById("status").value;
      const bannerFile = document.getElementById("bannerImage").files[0];

const cost = document.getElementById("cost").value.trim();
const facebookLink = document.getElementById("facebookLink").value.trim();
const eventbriteLink = document.getElementById("eventbriteLink").value.trim();
const otherLink = document.getElementById("otherLink").value.trim();
const mainBuyLink = document.getElementById("mainBuyLink").value.trim();

const isFeatured = document.getElementById("isFeatured").checked;
const allowComments = document.getElementById("allowComments").checked;
const allowRSVP = document.getElementById("allowRSVP").checked;


      if (!title || !description || !location || !eventDate || !status) {
        alert("Please fill all required fields.");
        return;
      }
  
      let imageUrl = "";
      if (bannerFile) {


        try {
          const slugTitle = title.toLowerCase().replace(/\s+/g, "-");
          const storageRef = ref(storage, `images/events/${slugTitle}/banner.jpg`);

          await uploadBytes(storageRef, bannerFile);
          imageUrl = await getDownloadURL(storageRef);
        } catch (error) {
          console.error("Image upload error:", error);
          alert("Failed to upload image.");
        }
      }else{

        imageUrl = document.getElementById("preview").src;

      }

      if (window.editingEventId) {
        const docRef = doc(db, "events", window.editingEventId);
        await updateDoc(docRef, {
          cost,
          facebookLink,
          eventbriteLink,
          otherLink,
          mainBuyLink,
          title,
          description,
          location,
          date: eventDate,
          tags,
          status,
          imageUrl,
            isFeatured,
  allowComments,
  allowRSVP,
  updatedAt: serverTimestamp(),
        });
        alert("Event updated.");
        window.editingEventId = null;
      } else {
        await addDoc(collection(db, "events"), {
          cost,
          facebookLink,
          eventbriteLink,
          otherLink,
          mainBuyLink,
          title,
          description,
          location,
          date: eventDate,
          tags,
          status,
          imageUrl,
          images: [],
            isFeatured,
            viewCount: 0,
  allowComments,
  allowRSVP,
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
  


  function resetEventForm() {
  const form = document.getElementById("eventForm");
  form.reset();

  // Clear the preview image
  const preview = document.getElementById("preview");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  
// Reset toggles
["isFeatured", "allowComments", "allowRSVP"].forEach(id => {
  document.getElementById(id).checked = false;
});

  // Reset file input manually
  const bannerInput = document.getElementById("bannerImage");
  if (bannerInput) {
    bannerInput.value = "";
  }

  // Clear editing state
  window.editingEventId = null;
}

// Attach event listener to reset button
document.getElementById("resetFormBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to clear the form?")) {
    resetEventForm();
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
      <p>${formatFirebaseDate(data.date)} – ${data.location}</p>
      <p>Status: ${data.status}</p>
      <img id="test101" src="${data.imageUrl || 'https://via.placeholder.com/300x150'}" class="w-full h-40 object-cover my-2"/>
      <button class="bg-green-500 text-white px-3 py-1 rounded viewBtn" data-id="${docSnap.id}">View</button>
      <button class="bg-blue-500 text-white px-3 py-1 rounded galleryBtn" data-id="${docSnap.id}">Gallery</button>
      <button class="bg-yellow-500 text-white px-3 py-1 rounded editBtn" data-id="${docSnap.id}">Edit</button>
      <button class="bg-red-500 text-white px-3 py-1 rounded deleteBtn" data-id="${docSnap.id}">Delete</button>
      <button class="bg-blue-500 text-white px-3 py-1 rounded analyticsBtn" data-id="${docSnap.id}">Analytics</button>

    `;
          console.log("data.imageUrl ",data.imageUrl);

    eventList.appendChild(card);
  });

  // 📌 Attach Edit/Delete Listeners
  document.querySelectorAll(".viewBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
    window.location.href = `../events/details/index.html?id=${id}`;
    });
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


    document.querySelectorAll(".galleryBtn").forEach((btn) => {
    btn.addEventListener("click", () => {

      
          document.getElementById("preview").classList.add("hidden");
          document.getElementById("edit-event-section").classList.add("hidden");
  document.getElementById("view-events-section").classList.add("hidden");
  document.getElementById("view-events-section").classList.remove("block");
          document.getElementById("analytics-section").classList.add("hidden");
          document.getElementById("gallery-section").classList.remove("hidden");

      const eventId = btn.getAttribute("data-id");
      window.editingEventId = eventId;

    loadGallery(eventId);
  });

    });

const gallerySection = document.getElementById("gallery-section");
const galleryForm = document.getElementById("gallery-upload-form");
const galleryGrid = document.getElementById("gallery-grid");

async function loadGallery(eventId) {
  galleryGrid.innerHTML = "<p class='col-span-full text-gray-500'>Loading gallery...</p>";

  const q = query(collection(db, "events", eventId, "gallery"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  galleryGrid.innerHTML = "";

  if (snapshot.empty) {
    galleryGrid.innerHTML = "<p class='col-span-full text-gray-500'>No media uploaded yet.</p>";
    return;
  }

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "relative group";

    const isVideo = data.type === "video";
    const mediaElement = isVideo
      ? `<video src="${data.url}" controls class="w-full h-40 object-cover rounded"></video>`
      : `<img src="${data.url}" alt="Gallery" class="w-full h-40 object-cover rounded" />`;

    card.innerHTML = `
      ${mediaElement}
      <button onclick="deleteGalleryItem('${eventId}', '${docSnap.id}', '${data.path}')" 
              class="absolute top-2 right-2 bg-red-600 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
        Delete
      </button>
    `;

    galleryGrid.appendChild(card);
  });
}

galleryForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("mediaFile");
  const type = document.getElementById("mediaType").value;
  const file = fileInput.files[0];
  if (!file || !window.editingEventId) return;

  const fileRef = ref(storage, `events/${window.editingEventId}/gallery/${Date.now()}-${file.name}`);
  const uploadTask = await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(uploadTask.ref);

  await addDoc(collection(db, "events", window.editingEventId, "gallery"), {
    url: downloadURL,
    type,
    path: fileRef.fullPath,
    createdAt: serverTimestamp()
  });

  galleryForm.reset();
  loadGallery(window.editingEventId);
});

async function deleteGalleryItem(eventId, docId, filePath) {
  if (!confirm("Delete this item?")) return;

  try {
    await deleteDoc(doc(db, "events", eventId, "gallery", docId));
    await deleteObject(ref(storage, filePath));
    loadGallery(eventId);
  } catch (err) {
    console.error("Error deleting gallery item:", err);
    alert("Failed to delete media.");
  }
}



  document.querySelectorAll(".editBtn").forEach((btn) => {
    btn.addEventListener("click", () => {

      
          document.getElementById("preview").classList.remove("hidden");
          document.getElementById("edit-event-section").classList.remove("hidden");
  document.getElementById("view-events-section").classList.add("hidden");
  document.getElementById("view-events-section").classList.remove("block");
          document.getElementById("analytics-section").classList.add("hidden");
          document.getElementById("gallery-section").classList.add("hidden");

      const id = btn.getAttribute("data-id");
      const event = snapshot.docs.find((d) => d.id === id).data();
      document.getElementById("title").value = event.title;
      document.getElementById("description").value = event.description;
      document.getElementById("location").value = event.location;
      document.getElementById("preview").src = event.imageUrl;
      


const eventDate = event.date?.toDate(); // Convert Firestore Timestamp to JS Date
if (eventDate instanceof Date && !isNaN(eventDate)) {
  const isoString = eventDate.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:MM'
  document.getElementById("date").value = isoString;
}
const eventEndDate = event.date?.toDate(); // Convert Firestore Timestamp to JS Date
if (eventEndDate instanceof Date && !isNaN(eventEndDate)) {
  const isoString = eventEndDate.toISOString().slice(0, 16); // 'YYYY-MM-DDTHH:MM'
  document.getElementById("endDate").value = isoString;
}

      document.getElementById("tags").value = event.tags.join(", ");
      document.getElementById("status").value = event.status;

      document.getElementById("isFeatured").checked = event.isFeatured;
      document.getElementById("allowComments").checked = event.allowComments;
      document.getElementById("allowRSVP").checked = event.allowRSVP;
      window.editingEventId = id;
    });
  });


async function loadAnalytics(eventId) {
  const eventRef = doc(db, "events", eventId);
  const eventSnap = await getDoc(eventRef);

  // 📊 Load view counts
  const data = eventSnap.data();
  const totalViews = data?.viewCount || 0;
  const uniqueViews = data?.uniqueViewCount || 0;
  document.getElementById("analyticsViews").innerText = `${totalViews} total views (${uniqueViews} unique)`;

  // 📅 Load RSVPs (assuming RSVP collection exists)
  const rsvpSnap = await getDocs(collection(db, "events", eventId, "rsvps"));
  document.getElementById("analyticsRSVPs").innerText = `${rsvpSnap.size} RSVPs`;

  // 💬 Load Comments
  const commentsSnap = await getDocs(query(
    collection(db, "events", eventId, "comments"),
    where("visible", "==", true),
    orderBy("createdAt", "desc")
  ));

  const commentsList = document.getElementById("analyticsComments");
  commentsList.innerHTML = "";

  if (commentsSnap.empty) {
    const li = document.createElement("li");
    li.textContent = "No comments yet.";
    commentsList.appendChild(li);
  } else {
    commentsSnap.forEach((doc) => {
      const c = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `<strong>${c.name || "Anonymous"}:</strong> ${c.content}`;
      commentsList.appendChild(li);
    });
  }

  // 👁️ Show the analytics section
  document.getElementById("analytics-section").classList.remove("hidden");
}

  document.querySelectorAll(".analyticsBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
          document.getElementById("analytics-section").classList.remove("hidden");
  document.getElementById("view-events-section").classList.add("hidden");
  document.getElementById("view-events-section").classList.remove("block");
          document.getElementById("gallery-section").classList.add("hidden");

      const id = btn.getAttribute("data-id");
    window.editingEventId = id;
loadAnalytics(id);


    });
  });
}




let allSubscribers = [];

async function loadSubscribers() {
  const tbody = document.getElementById("subscriber-table-body");
  const searchInput = document.getElementById("subscriber-search");

  tbody.innerHTML = `<tr><td colspan="4" class="text-center p-4">Loading...</td></tr>`;
  allSubscribers = [];

  try {
    const querySnapshot = await getDocs(collection(db, "subscribers"));
    querySnapshot.forEach((docSnap) => {
      const subscriber = docSnap.data();
      allSubscribers.push({ id: docSnap.id, ...subscriber });
    });

    renderSubscribers(allSubscribers);

    searchInput.addEventListener("input", () => {
      const filter = searchInput.value.toLowerCase();
      const filtered = allSubscribers.filter((s) =>
        s.name?.toLowerCase().includes(filter) ||
        s.email?.toLowerCase().includes(filter) ||
        s.phone?.toLowerCase().includes(filter)
      );
      renderSubscribers(filtered);
    });

  } catch (err) {
    console.error("Error loading subscribers:", err);
    tbody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-red-500">Failed to load subscribers.</td></tr>`;
  }
}


function renderSubscribers(subscribers) {
  const tbody = document.getElementById("subscriber-table-body");
  if (subscribers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-gray-500">No subscribers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = subscribers.map((s) => `
    <tr class="border-b">
      <td class="p-2">${s.name || "-"}</td>
      <td class="p-2">${s.email || "-"}</td>
      <td class="p-2">${s.phone || "-"}</td>
      <td class="p-2 text-gray-500 text-sm">${s.createdAt?.toDate().toLocaleString() || "-"}</td>
    </tr>
  `).join("");
}

async function removeSubscriber(id) {
  const confirmed = confirm("Are you sure you want to remove this subscriber?");
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "subscribers", id));
    allSubscribers = allSubscribers.filter((s) => s.id !== id);
    renderSubscribers(allSubscribers);
  } catch (err) {
    console.error("Failed to delete subscriber:", err);
    alert("Failed to delete subscriber.");
  }
}


document.getElementById("btn-manage-events").addEventListener("click", () => {
  showAdminSection("events");
});

document.getElementById("btn-view-subscribers").addEventListener("click", () => {
  showAdminSection("subscribers");
});
document.getElementById("btn-view-contacts").addEventListener("click", () => {
  showAdminSection("contacts");
});

function showAdminSection(section) {
  document.getElementById("admin-events").classList.add("hidden");
  document.getElementById("admin-subscribers").classList.add("hidden");
  document.getElementById("admin-contacts").classList.add("hidden");

  if (section === "events") {
    document.getElementById("admin-events").classList.remove("hidden");
  } else if (section === "subscribers") {
    document.getElementById("admin-subscribers").classList.remove("hidden");
    if (typeof loadSubscribers === "function") loadSubscribers(); // Avoid error if not defined
  } else if (section === "contacts") {
    document.getElementById("admin-contacts").classList.remove("hidden");
    if (typeof loadContacts === "function") loadContacts(); // Avoid error if not defined
  }
}

window.addEventListener("DOMContentLoaded", () => {
  showAdminSection("events"); // or "subscribers"
});

// Handle button click to open file picker
document.getElementById('uploadTrigger').addEventListener('click', () => {
  document.getElementById('bannerImage').click();
});

// Handle image file input and preview
document.getElementById('bannerImage').addEventListener('change', previewImage);

// Define preview function
function previewImage(event) {
  const input = event.target;
  const preview = document.getElementById('preview');

  if (input.files && input.files[0]) {
    const reader = new FileReader();

    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
      preview.classList.remove('hidden');

    };

    reader.readAsDataURL(input.files[0]);
  }
}

// Optional: make function globally accessible
window.previewImage = previewImage;



document.getElementById('viewEventsBtn').addEventListener('click', () => {
  document.getElementById('view-events-section').classList.remove('hidden');
  document.getElementById('edit-event-section').classList.add('hidden');
  document.getElementById("analytics-section").classList.add("hidden");
  document.getElementById("gallery-section").classList.add("hidden");

});

document.getElementById('editEventBtn').addEventListener('click', () => {
  document.getElementById('edit-event-section').classList.remove('hidden');
  document.getElementById('view-events-section').classList.add('hidden');
  document.getElementById("analytics-section").classList.add("hidden");
   document.getElementById("gallery-section").classList.add("hidden");


});



function toggleCheckbox(checkboxId) {
  const checkbox = document.getElementById(checkboxId);
  if (checkbox) {
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change')); // trigger any change listener if needed
  }
}

document.getElementById("toggleFeatured").addEventListener("click", () => {
  toggleCheckbox("isFeatured");
});

document.getElementById("toggleComments").addEventListener("click", () => {
  toggleCheckbox("allowComments");
});

document.getElementById("toggleRSVP").addEventListener("click", () => {
  toggleCheckbox("allowRSVP");
});




let contactsOrder = "desc"; // Start with newest first

document.getElementById("sortToggle").addEventListener("click", () => {
  contactsOrder = contactsOrder === "desc" ? "asc" : "desc";
  document.getElementById("sortToggle").innerText =
    contactsOrder === "desc" ? "Sort: Newest First" : "Sort: Oldest First";
  loadContacts();
});

async function deleteContact(id) {
  if (confirm("Are you sure you want to delete this contact message?")) {
    try {
      await deleteDoc(doc(db, "contacts", id));
      loadContacts();
    } catch (err) {
      console.error("Error deleting contact:", err);
      alert("❌ Failed to delete. Check the console.");
    }
  }
}

async function loadContacts() {
  const contactsContainer = document.getElementById("contacts-list");
  contactsContainer.innerHTML = "<p class='text-gray-500'>Loading...</p>";

  try {
    const q = query(collection(db, "contacts"), orderBy("timestamp", contactsOrder));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      contactsContainer.innerHTML = "<p class='text-gray-500'>No contact messages yet.</p>";
      return;
    }

    contactsContainer.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      const card = document.createElement("div");
      card.className = "bg-white border rounded shadow mb-4";

      card.innerHTML = `
        <div class="p-4 flex justify-between items-center cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-t" onclick="this.nextElementSibling.classList.toggle('hidden')">
          <div>
            <p class="font-semibold">${data.name}</p>
            <p class="text-sm text-gray-500">${data.timestamp?.toDate().toLocaleString() || "Unknown"}</p>
          </div>
          <button onclick="event.stopPropagation(); deleteContact('${id}')" class="text-red-600 hover:underline text-sm">Delete</button>
        </div>
        <div class="hidden px-4 pb-4 pt-2">
          <p><strong>Email:</strong> <a href="mailto:${data.email}" class="text-blue-600 underline">${data.email}</a></p>
          <p><strong>Phone:</strong> ${data.phone || "—"}</p>
          <p><strong>Type:</strong> ${data.type}</p>
          <p class="mt-2"><strong>Message:</strong></p>
          <p class="whitespace-pre-line text-gray-700">${data.message}</p>
        </div>
      `;

      contactsContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading contacts:", error);
    contactsContainer.innerHTML = "<p class='text-red-600'>Error loading messages. Check console.</p>";
  }
}

    

