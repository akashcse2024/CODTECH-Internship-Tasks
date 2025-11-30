// === CONFIGURATION ===
const apiKey = "aba5ef7a09574befe93916d0a0a09003";
const weatherBase = "https://api.openweathermap.org/data/2.5/weather?units=metric";
const forecastBase = "https://api.openweathermap.org/data/2.5/forecast?units=metric";

// === DOM ELEMENTS ===
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const navBtns = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll("section");
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
const tnChips = document.getElementById("tnChips");

// === GLOBAL VARIABLES ===
let mapInstance;
let mapMarker;

// === INITIALIZATION ===
document.addEventListener("DOMContentLoaded", () => {
    initMap();
    generateTNChips();
    fetchCity("Chennai"); // Default City
});

// === 1. MAP FUNCTIONALITY (FIXED) ===
function initMap() {
    // Center on Tamil Nadu initially
    mapInstance = L.map('mapObj').setView([11.1271, 78.6569], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapInstance);

    // ADD CLICK INTERACTIVITY: Click map to search location
    mapInstance.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        // Fetch weather by coordinates
        await fetchByCoords(lat, lng);
        // Switch back to home tab to see result
        document.querySelector('[data-target="home"]').click();
    });
}

// Update Map Position and Marker
function updateMap(lat, lon, name) {
    mapInstance.setView([lat, lon], 10);
    
    if (mapMarker) mapInstance.removeLayer(mapMarker);
    
    mapMarker = L.marker([lat, lon]).addTo(mapInstance)
        .bindPopup(`<b>${name}</b><br>Selected Location`)
        .openPopup();
}

// === 2. WEATHER FETCHING ===
async function fetchCity(city) {
    const url = `${weatherBase}&q=${city}&appid=${apiKey}`;
    await getWeatherData(url);
}

async function fetchByCoords(lat, lon) {
    const url = `${weatherBase}&lat=${lat}&lon=${lon}&appid=${apiKey}`;
    await getWeatherData(url);
}

async function getWeatherData(url) {
    const loader = document.getElementById('loader');
    const display = document.getElementById('weatherDisplay');
    const error = document.getElementById('errorMsg');
    
    try {
        loader.style.display = 'block';
        display.style.display = 'none';
        error.style.display = 'none';

        const res = await fetch(url);
        if (!res.ok) throw new Error("Location not found");
        const data = await res.json();

        // Update UI
        document.getElementById('cityName').innerText = data.name;
        document.getElementById('currDate').innerText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        document.getElementById('tempVal').innerText = Math.round(data.main.temp) + "°C";
        document.getElementById('weatherDesc').innerText = data.weather[0].description;
        document.getElementById('humidityVal').innerText = data.main.humidity + "%";
        document.getElementById('windVal').innerText = data.wind.speed + " km/h";
        document.getElementById('pressureVal').innerText = data.main.pressure + " hPa";
        document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;

        // Update Map
        updateMap(data.coord.lat, data.coord.lon, data.name);

        // Get Forecast
        fetchForecast(data.name);

        loader.style.display = 'none';
        display.style.display = 'block';

        return data; // For Chatbot

    } catch (err) {
        loader.style.display = 'none';
        error.innerText = "Location not found. Please try again.";
        error.style.display = 'block';
        return null;
    }
}

// === 3. FORECAST FETCHING ===
async function fetchForecast(city) {
    try {
        const res = await fetch(`${forecastBase}&q=${city}&appid=${apiKey}`);
        const data = await res.json();
        const scrollDiv = document.getElementById('forecastScroll');
        scrollDiv.innerHTML = "";

        // Filter for 12:00 PM data roughly
        const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));

        daily.forEach(day => {
            const dateStr = new Date(day.dt_txt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
            const item = `
                <div class="forecast-item">
                    <p style="font-size: 14px; color: #ccc;">${dateStr}</p>
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" width="50">
                    <h3 style="margin: 5px 0;">${Math.round(day.main.temp)}°C</h3>
                    <p style="font-size: 12px;">${day.weather[0].main}</p>
                </div>
            `;
            scrollDiv.innerHTML += item;
        });
        document.getElementById('forecastContainer').style.display = 'block';
    } catch (e) { console.log("Forecast error"); }
}

// === 4. NAVIGATION & TABS ===
navBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Active Class Logic
        navBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // Show Section
        const target = btn.getAttribute("data-target");
        sections.forEach(s => s.classList.remove("active-section"));
        document.getElementById(target).classList.add("active-section");

        // Close mobile menu
        navLinks.classList.remove("mobile-active");

        // FIX MAP RENDERING BUG
        if (target === 'map') {
            setTimeout(() => {
                mapInstance.invalidateSize();
            }, 100);
        }
    });
});

hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("mobile-active");
});

// === 5. TAMIL NADU CHIPS ===
function generateTNChips() {
    const districts = ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Ooty', 'Kodaikanal'];
    districts.forEach(city => {
        const chip = document.createElement("div");
        chip.className = "chip";
        chip.innerText = city;
        chip.onclick = () => fetchCity(city);
        tnChips.appendChild(chip);
    });
}

// === 6. SEARCH HANDLERS ===
searchBtn.addEventListener("click", () => {
    if(cityInput.value) fetchCity(cityInput.value);
});
cityInput.addEventListener("keypress", (e) => {
    if(e.key === "Enter" && cityInput.value) fetchCity(cityInput.value);
});

// === 7. AI CHATBOT LOGIC ===
const toggleChatBtn = document.getElementById("toggleChatBtn");
const closeChatBtn = document.getElementById("closeChatBtn");
const chatBox = document.getElementById("chatBox");
const sendChatBtn = document.getElementById("sendChatBtn");
const chatInputVal = document.getElementById("chatInput");
const chatOutput = document.getElementById("chatOutput");

toggleChatBtn.addEventListener("click", () => chatBox.style.display = "flex");
closeChatBtn.addEventListener("click", () => chatBox.style.display = "none");

async function processChat() {
    const text = chatInputVal.value.trim();
    if(!text) return;

    // User Msg
    addBubble(text, 'user-msg');
    chatInputVal.value = "";

    // Bot Thinking
    const loadingId = addBubble("Analysing weather patterns...", 'bot-msg');

    // NLP Logic (Simple)
    let city = extractCity(text);
    
    if(!city) {
        updateBubble(loadingId, "I didn't catch the city name. Try 'Weather in Chennai'.");
        return;
    }

    // Fetch Data
    const data = await fetchCity(city); // Updates dashboard too!

    if(!data) {
        updateBubble(loadingId, `I couldn't find weather data for ${city}.`);
        return;
    }

    // Formulate Reply
    const reply = `Current condition in ${data.name}: ${Math.round(data.main.temp)}°C and ${data.weather[0].description}. Humidity is ${data.main.humidity}%.`;
    updateBubble(loadingId, reply);
}

function extractCity(text) {
    const words = text.replace(/[?]/g, '').split(' ');
    const ignore = ['what', 'is', 'weather', 'in', 'at', 'like', 'temperature', 'how', 'today'];
    
    // Try to find word after "in" or "at"
    const prepIndex = words.findIndex(w => w.toLowerCase() === 'in' || w.toLowerCase() === 'at');
    if (prepIndex > -1 && prepIndex < words.length - 1) return words[prepIndex + 1];

    // Fallback: return last word
    return words[words.length - 1];
}

function addBubble(text, cls) {
    const div = document.createElement("div");
    div.className = `message ${cls}`;
    div.id = Date.now();
    div.innerHTML = text;
    chatOutput.appendChild(div);
    chatOutput.scrollTop = chatOutput.scrollHeight;
    return div.id;
}

function updateBubble(id, text) {
    const div = document.getElementById(id);
    if(div) div.innerHTML = text;
}

sendChatBtn.addEventListener("click", processChat);
chatInputVal.addEventListener("keypress", (e) => {
    if(e.key === "Enter") processChat();
});