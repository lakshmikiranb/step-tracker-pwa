// ---------- Variables ----------
let steps = 0;
const caloriesPerStep = 0.04;
let userLocation = { lat: 0, lng: 0 };
let chart;
let editIndex = null;

const stepsEl = document.getElementById('steps');
const caloriesEl = document.getElementById('calories');
const locationEl = document.getElementById('location');
const contactForm = document.getElementById('contactForm');
const contactNameInput = document.getElementById('contactName');
const contactEmailInput = document.getElementById('contactEmail');
const contactListEl = document.getElementById('contactList');
const shareBtn = document.getElementById('shareBtn');

// ---------- Contacts (from localStorage) ----------
let contacts = JSON.parse(localStorage.getItem('contacts')) || [];

// Render contact list
function renderContacts() {
    contactListEl.innerHTML = '';
    contacts.forEach((c, index) => {
        const li = document.createElement('li');
        li.textContent = `${c.name} (${c.email})`;

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.style.marginLeft = '10px';
        editBtn.onclick = () => {
            contactNameInput.value = c.name;
            contactEmailInput.value = c.email;
            editIndex = index;
        };
        li.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.style.marginLeft = '5px';
        delBtn.onclick = () => {
            contacts.splice(index, 1);
            saveContacts();
            renderContacts();
        };
        li.appendChild(delBtn);

        contactListEl.appendChild(li);
    });
}

// Save contacts
function saveContacts() {
    localStorage.setItem('contacts', JSON.stringify(contacts));
}

// Handle contact form submit
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = contactNameInput.value.trim();
    const email = contactEmailInput.value.trim();
    if (name && email) {
        if (editIndex !== null) {
            contacts[editIndex] = { name, email };
            editIndex = null;
        } else {
            contacts.push({ name, email });
        }
        saveContacts();
        renderContacts();
        contactForm.reset();
    }
});

// Initial render
renderContacts();

// ---------- Step Tracking ----------
if (window.DeviceMotionEvent) {
    let lastAcc = { x: null, y: null, z: null };
    window.addEventListener('devicemotion', event => {
        const acc = event.accelerationIncludingGravity;
        if (lastAcc.x !== null) {
            const delta = Math.abs(acc.x - lastAcc.x) + Math.abs(acc.y - lastAcc.y) + Math.abs(acc.z - lastAcc.z);
            if (delta > 1.2) {
                steps++;
                updateStats();
                saveDailyStats();
            }
        }
        lastAcc = { x: acc.x, y: acc.y, z: acc.z };
    });
} else {
    alert('Device motion not supported.');
}

// ---------- Geolocation ----------
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
        userLocation.lat = pos.coords.latitude;
        userLocation.lng = pos.coords.longitude;
        locationEl.textContent = `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`;
    }, () => locationEl.textContent = 'Location denied');
}

// ---------- Share All Details ----------
shareBtn.addEventListener('click', () => {
    const data = { steps, calories: (steps * caloriesPerStep).toFixed(2), location: userLocation };
    contacts.forEach(c => console.log(`Sharing with ${c.email}:`, data));
    alert('Details shared with all contacts (simulated)!');
});

// ---------- Daily Stats (IndexedDB) ----------
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

function saveDailyStats() {
    const tx = db.transaction(['dailyStats'], 'readwrite');
    const store = tx.objectStore('dailyStats');
    const today = new Date().toISOString().split('T')[0];
    store.put({ date: today, steps, calories: (steps * caloriesPerStep).toFixed(2) });
}

function loadDailyStats() {
    const tx = db.transaction(['dailyStats'], 'readonly');
    const store = tx.objectStore('dailyStats');
    const request = store.getAll();
    request.onsuccess = () => {
        let stats = request.result;
        const today = new Date().toISOString().split('T')[0];
        if (!stats.find(s => s.date === today)) {
            stats.push({ date: today, steps: 0, calories: 0 });
        }
        const todayStat = stats.find(s => s.date === today);
        steps = todayStat.steps;
        updateStats();
        drawChart(stats);
    };
}

// ---------- Update UI Stats ----------
function updateStats() {
    stepsEl.textContent = steps;
    caloriesEl.textContent = (steps * caloriesPerStep).toFixed(2);
}

// ---------- Draw Chart ----------
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

// ---------- Register Service Worker ----------
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('Service Worker Registered'));
}
