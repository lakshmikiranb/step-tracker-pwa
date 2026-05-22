// ... existing code ...

// Load stats and initialize chart
function loadDailyStats() {
    const tx = db.transaction(['dailyStats'], 'readonly');
    const store = tx.objectStore('dailyStats');
    const request = store.getAll();
    request.onsuccess = () => {
        let stats = request.result;
        const today = new Date().toISOString().split('T')[0];

        // If no stats for today, create an initial zero entry
        if (!stats.find(s => s.date === today)) {
            stats.push({ date: today, steps: 0, calories: 0 });
        }

        // Update steps display for today
        const todayStat = stats.find(s => s.date === today);
        if (todayStat) {
            steps = todayStat.steps;
            updateDisplay();
        }

        // Draw chart for all stats (including zeros)
        drawChart(stats);
    };
}

// Draw chart function remains the same
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
