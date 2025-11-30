document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('site-list');
    const prodTimeEl = document.getElementById('prod-time');
    const unprodTimeEl = document.getElementById('unprod-time');

    const PRODUCTIVE_SITES = ['github.com', 'stackoverflow.com', 'w3schools.com', 'chatgpt.com', 'docs.google.com', 'localhost'];
    const UNPRODUCTIVE_SITES = ['youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'netflix.com'];

    const data = await chrome.storage.local.get(null);
    const sites = Object.entries(data).sort((a, b) => b[1] - a[1]);

    let totalProd = 0;
    let totalUnprod = 0;

    listContainer.innerHTML = '';

    if (sites.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center; color:#888;">No data yet. Browse the web!</p>';
        return;
    }

    sites.forEach(([domain, seconds]) => {
        if (seconds < 2) return;

        let type = 'neutral';
        if (PRODUCTIVE_SITES.some(s => domain.includes(s))) type = 'prod';
        else if (UNPRODUCTIVE_SITES.some(s => domain.includes(s))) type = 'unprod';

        if (type === 'prod') totalProd += seconds;
        if (type === 'unprod') totalUnprod += seconds;

        const div = document.createElement('div');
        div.className = `site-row ${type}`;
        div.innerHTML = `
            <span class="domain">${domain}</span>
            <span class="duration">${formatTime(seconds)}</span>
        `;
        listContainer.appendChild(div);
    });

    prodTimeEl.innerText = formatTime(totalProd);
    unprodTimeEl.innerText = formatTime(totalUnprod);
});

function formatTime(seconds) {
    if (seconds < 60) return Math.round(seconds) + 's';
    const min = Math.floor(seconds / 60);
    const sec = Math.round(seconds % 60);
    if (min > 60) {
        const hrs = Math.floor(min / 60);
        return hrs + 'h ' + (min % 60) + 'm';
    }
    return min + 'm ' + sec + 's';
}