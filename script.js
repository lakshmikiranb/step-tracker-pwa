// Variables
let steps = 0;
const caloriesPerStep = 0.04;
let userLocation = { lat: 0, lng: 0 };
const stepsEl = document.getElementById('steps');
const caloriesEl = document.getElementById('calories');
const locationEl = document.getElementById('location');
const contactListEl = document.getElementById('contactList');
const shareBtn = document.getElementById('shareBtn');
let chart;

// Dummy contacts
const contacts = [
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" }
];
contacts.forEach(c => {
    const li = document.createElement('li');
    li.textContent = `${c.name} (${c.email})`;
    contactListEl.appendChild(li);
});

// IndexedDB for persistent storage
let db;
const request = indexedDB.open('StepTrackerDB', 1);
request.onupgradeneeded = event => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('dailyStats')) {
        db.createObjectStore('dailyStats', { keyPath: 'date' });
    }
};
request.onsuccess = event => {
    db = event.target.result;
    loadDailyStats();
};
request.onerror = event => console.error('IndexedDB error', event);

// Save stats
function saveStats() {
    const tx = db.transaction(['dailyStats'], 'readwrite');
    const store = tx.objectStore('dailyStats');
    const today = new Date().toISOString().split('T')[0];
    store.put({ date: today, steps, calories: (steps * caloriesPerStep).toFixed(2) });
}

// Load stats
function loadDailyStats() {
    const tx = db.transaction(['dailyStats'], 'readonly');
    const store = tx.objectStore('dailyStats');
    const request = store.getAll();
    request.onsuccess = () => {
        const stats = request.result;
        if (stats.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const todayStat = stats.find(s => s.date === today);
            if (todayStat) {
                steps = todayStat.steps;
                updateDisplay();
            }
            drawChart(stats);
        }
    };
}

// Update display
function updateDisplay() {
    stepsEl.textContent = steps;
    caloriesEl.textContent = (steps * caloriesPerStep).toFixed(2);
}

// DeviceMotion for steps
if (window.DeviceMotionEvent) {
    let lastAcc = { x: null, y: null, z: null };
    window.addEventListener('devicemotion', event => {
        const acc = event.accelerationIncludingGravity;
        if (lastAcc.x !== null) {
            const delta = Math.abs(acc.x - lastAcc.x) + Math.abs(acc.y - lastAcc.y) + Math.abs(acc.z - lastAcc.z);
            if (delta > 1.2) {
                steps++;
                updateDisplay();
                saveStats();
            }
        }
        lastAcc = { x: acc.x, y: acc.y, z: acc.z };
    });
} else alert('Device motion not supported.');

// Geolocation
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
        userLocation.lat = pos.coords.latitude;
        userLocation.lng = pos.coords.longitude;
        locationEl.textContent = `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`;
    }, () => locationEl.textContent = 'Location denied');
}

// Share button
shareBtn.addEventListener('click', () => {
    const data = { steps, calories: (steps * caloriesPerStep).toFixed(2), location: userLocation };
    contacts.forEach(c => console.log(`Sharing with ${c.email}:`, data));
    alert('Details shared with all contacts (simulated)!');
});

// Chart.js for daily progress
function drawChart(stats) {
    const labels = stats.map(s => s.date);
    const data = stats.map(s => s.steps);
    const ctx = document.getElementById('progressChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Steps per Day',
                data,
                fill: false,
                borderColor: 'green',
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });
}

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('Service Worker Registered'));
}