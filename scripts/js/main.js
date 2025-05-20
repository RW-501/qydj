// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase Config
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

// Get Featured Event
async function loadFeaturedEvent() {
  const q = query(collection(db, "events"), where("status", "==", "upcoming"), orderBy("date"), limit(1));
  const querySnapshot = await getDocs(q);
  const featured = querySnapshot.docs[0]?.data();

  if (featured) {
    document.getElementById("featured-title").innerText = featured.title;
    initCountdown(new Date(featured.date));
  } else {
    document.getElementById("featured-title").innerText = "Stay tuned!";
    document.getElementById("countdown").innerText = "";
  }
}

// Countdown Timer
function initCountdown(targetDate) {
  const countdown = document.getElementById("countdown");
  const update = () => {
    const now = new Date();
    const diff = targetDate - now;
    if (diff <= 0) return countdown.innerText = "Event Started!";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    countdown.innerText = `${days}d ${hours}h ${mins}m`;
  };
  update();
  setInterval(update, 60000); // update every minute
}

// Load Event Slider
async function loadEventSlider() {
  const q = query(collection(db, "events"), where("status", "==", "upcoming"), orderBy("date"));
  const querySnapshot = await getDocs(q);
  const container = document.getElementById("event-slider");

  querySnapshot.forEach(doc => {
    const event = doc.data();
    const slide = document.createElement("div");
    slide.classList.add("swiper-slide");
    slide.innerHTML = `
      <div class="bg-white shadow-lg rounded overflow-hidden">
        <img src="${event.bannerImage}" alt="${event.title}" class="w-full h-48 object-cover">
        <div class="p-4">
          <h4 class="font-bold text-lg">${event.title}</h4>
          <p class="text-sm text-gray-600">${new Date(event.date).toLocaleDateString()} | ${event.location}</p>
        </div>
      </div>
    `;
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
}

// Init
window.onload = () => {
  AOS.init();
  loadFeaturedEvent();
  loadEventSlider();
};
