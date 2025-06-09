// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
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

function formatFirebaseDate(dateInput) {
  let dateObj;

  if (typeof dateInput?.toDate === 'function') {
    dateObj = dateInput.toDate(); // Firestore Timestamp
  } else {
    try {
      dateObj = new Date(dateInput);
    } catch (e) {
      console.warn("Invalid date input:", dateInput);
      return null;
    }
  }

  if (isNaN(dateObj)) return null;

  return dateObj.toLocaleString("en-US", {
    weekday: "long",        // "Saturday"
    year: "numeric",        // "2025"
    month: "long",          // "October"
    day: "numeric",         // "26"
    hour: "numeric",        // "7"
    minute: "2-digit",      // "00"
    hour12: true            // "PM"
  });
}


function formatFirebaseDateCD(dateInput) {
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

function initCountdown(targetDate) {
  const countdown = document.getElementById("countdown");

  if (!(targetDate instanceof Date) || isNaN(targetDate)) {
    countdown.innerText = "Invalid countdown date";
    console.error("Countdown failed: invalid targetDate", targetDate);
    return;
  }

  const updateCountdown = () => {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      countdown.innerText = "Event Started!";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    countdown.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  updateCountdown(); // Run immediately
  setInterval(updateCountdown, 1000); // Update every second
}




async function loadFeaturedEvent() {
  const q = query(
    collection(db, "events"),
    where("status", "==", "upcoming"),
    orderBy("date"),
    limit(1)
  );

  try {
    const querySnapshot = await getDocs(q);
const featuredDoc = querySnapshot.docs[0];
const featured = featuredDoc?.data();
const featuredId = featuredDoc?.id;

if (featured && featured.isFeatured) {
  console.log("Featured Event ID:", featuredId);
  console.log("Featured Event Data:", featured);

      document.getElementById("featured-title").innerText = featured.title || "Upcoming Event";
          if (featured.allowRSVP) {
      document.getElementById("rsvp-link").style.display = "block";

      const rsvpLink = `https://rw-501.github.io/qydj/events/rsvp/index.html?id=${featuredId}`;

      document.getElementById("rsvp-link").href = rsvpLink;
          }else{
      document.getElementById("rsvp-link").style.display = "none";

          }

      document.getElementById("featured-image").style.backgroundImage =
        `url('${featured.imageUrl || 'default-banner.jpg'}')`;
      initCountdown(new Date(formatFirebaseDateCD(featured.date)));
    } else {
      document.getElementById("featured-title").innerText = "Stay tuned!";
      document.getElementById("countdown").innerText = "";
      document.getElementById("featured-image").style.backgroundImage =
        `url('${'default-banner.jpg'}')`;
      document.getElementById("rsvp-link").style.display = "none";

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
  const eventDate = event.date ? formatFirebaseDate(event.date) : "TBD";

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

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const name = document.getElementById("subscriber-name").value.trim();
      const email = document.getElementById("subscriber-email").value.trim().toLowerCase();
      const phone = document.getElementById("subscriber-phone").value.trim();

      if (!name || (!email && !phone)) {
        alert("Please enter your name and at least an email or phone number.");
        return;
      }

      try {
        // Avoid duplicate subscriptions by email
        if (email) {
          const q = query(collection(db, "subscribers"), where("email", "==", email));
          const existing = await getDocs(q);
          if (!existing.empty) {
            alert("This email is already subscribed.");
            return;
          }
        }

        await addDoc(collection(db, "subscribers"), {
          name,
          email: email || null,
          phone: phone || null,
          createdAt: serverTimestamp()
        });

        form.reset();
        document.getElementById("subscribe-message").classList.remove("hidden");
      } catch (error) {
        console.error("Error subscribing:", error);
        alert("❌ Something went wrong. Please try again.");
      }
    });
  }
  
  const eventContainer = document.getElementById("events-container");
  const loadingText = document.getElementById("loading-text");

  async function loadEvents(status = "upcoming") {
    if (eventContainer){
    loadingText.classList.remove("hidden");
    eventContainer.innerHTML = "";

    const q = query(
      collection(db, "events"),
      where("status", "==", status),
      orderBy("date", status === "past" ? "desc" : "asc")
    );

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        eventContainer.innerHTML = `<p class="col-span-full text-center text-gray-500">No ${status} events found.</p>`;
        return;
      }

      querySnapshot.forEach((doc) => {
        const event = doc.data();
        const card = document.createElement("div");
        card.className = "bg-white rounded shadow p-4";

        card.innerHTML = `
          <h3 class="text-lg font-semibold mb-2">${event.title || "Untitled"}</h3>
          <p class="text-gray-700 mb-1">${event.location || "Location TBD"}</p>
  <p class="text-sm text-gray-500">${formatFirebaseDate(event.date)}</p>
        `;

        eventContainer.appendChild(card);
      });
    } catch (err) {
      eventContainer.innerHTML = `<p class="col-span-full text-center text-red-500">Error loading events.</p>`;
      console.error("Error fetching events:", err);
    }
  }
  }

  // Initial load
  loadEvents("upcoming");

  // Tab button handlers
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const selected = btn.getAttribute("data-tab");

      document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.remove("active-tab", "bg-blue-600", "text-white");
        b.classList.add("bg-gray-200", "text-black");
      });

      btn.classList.remove("bg-gray-200", "text-black");
      btn.classList.add("active-tab", "bg-blue-600", "text-white");

      loadEvents(selected);
    });
  });


  document.getElementById("close-modal-btn")?.addEventListener("click", () => {
  document.getElementById("thank-you-modal").classList.add("hidden");
});
