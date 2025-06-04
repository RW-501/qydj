// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadFeaturedEvent() {
  const q = query(
    collection(db, "events"),
    where("status", "==", "upcoming"),
    orderBy("date"),
    limit(1)
  );

  try {
    const querySnapshot = await getDocs(q);
    const featured = querySnapshot.docs[0]?.data();

    if (featured) {
      document.getElementById("featured-title").innerText = featured.title || "Upcoming Event";
      document.getElementById("rsvp-link").href = featured.rsvpUrl || "#";
      document.getElementById("featured-image").style.backgroundImage =
        `url('${featured.imageUrl || 'default-banner.jpg'}')`;
      initCountdown(new Date(featured.date));
    } else {
      document.getElementById("featured-title").innerText = "Stay tuned!";
      document.getElementById("countdown").innerText = "";
    }
  } catch (error) {
    console.error("Error loading featured event:", error);
  }
}

// Load Event Slider
async function loadEventSlider() {
  const q = query(
    collection(db, "events"),
    where("status", "==", "upcoming"),
    orderBy("date")
  );

  try {
    const querySnapshot = await getDocs(q);
    const container = document.getElementById("event-slider");

    if (!container) return;

querySnapshot.forEach((doc) => {
  const event = doc.data();
  const eventId = doc.id; // Grab the document ID for the detail page
  const slide = document.createElement("div");
  slide.classList.add("swiper-slide");

  const imgUrl = event.imageUrl || "default-event.jpg";
  const eventDate = event.date ? new Date(event.date).toLocaleDateString() : "TBD";

  slide.innerHTML = `
    <div class="bg-white shadow-lg rounded overflow-hidden cursor-pointer hover:shadow-xl transition">
      <img src="${imgUrl}" alt="${event.title || 'Event'}" class="w-full h-48 object-cover">
      <div class="p-4">
        <h4 class="font-bold text-lg">${event.title || "Untitled Event"}</h4>
        <p class="text-sm text-gray-600">${eventDate} | ${event.location || "Unknown"}</p>
      </div>
    </div>
  `;

  // Add redirect behavior
  slide.onclick = () => {
    window.location.href = `../qydj/events/details/index.html?id=${eventId}`;
  };

  container.appendChild(slide);
});


    new Swiper(".mySwiper", {
      slidesPerView: 1.2,
      spaceBetween: 16,
      loop: true,
      breakpoints: {
        640: { slidesPerView: 1.5 },
        768: { slidesPerView: 2.5 },
        1024: { slidesPerView: 3.5 }
      }
    });
  } catch (error) {
    console.error("Error loading events:", error);
  }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  AOS.init();
  loadFeaturedEvent();
  loadEventSlider();
});




  const form = document.getElementById("subscribe-form");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("subscriber-name").value.trim();
    const email = document.getElementById("subscriber-email").value.trim();

    if (!name || !email) {
      alert("Please enter both your name and email.");
      return;
    }

    try {
      await addDoc(collection(db, "subscribers"), {
        name,
        email,
        createdAt: serverTimestamp(),
      });

      // Reset the form
      form.reset();

      // Show Thank You Modal
      document.getElementById("thank-you-modal").classList.remove("hidden");
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      alert("Oops! Something went wrong. Please try again.");
    }
  });

  window.closeThankYouModal = function () {
    document.getElementById("thank-you-modal").classList.add("hidden");
  };