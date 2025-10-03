const API_BASE_URL = 'https://anveshak-firebase.onrender.com';
const deviceListEl = document.getElementById('device-list');
const historyListEl = document.getElementById('history-list');
const form = document.getElementById('notification-form');
const sendStatusEl = document.getElementById('send-status');
const sendButton = document.getElementById('send-button');

let allDevices = [];

async function loadDevices() {
    try {
        const response = await fetch(`${API_BASE_URL}/devices`);
        allDevices = await response.json();
        filterDevices('All');
        document.querySelector('.filter-btn.active')?.classList.remove('active');
        document.querySelector('.filter-btn').classList.add('active');
    } catch (error) {
        deviceListEl.innerHTML = 'Error loading devices.';
        console.error(error);
    }
}

function filterDevices(platform) {
    deviceListEl.innerHTML = '';

    const devicesToDisplay = platform === 'All'
        ? allDevices
        : allDevices.filter(device => device.platform === platform);

    if (devicesToDisplay.length === 0) {
        deviceListEl.innerHTML = 'No devices match this filter.';
        return;
    }

    devicesToDisplay.forEach(device => {
        const lastOpened = device.lastOpened._seconds ? new Date(device.lastOpened._seconds * 1000) : new Date(device.lastOpened);
        const deviceHtml = `
            <div class="device-item">
                <p class="device-name">${device.deviceName}</p>
                <p><strong>User:</strong> ${device.username} (${device.userEmail})</p>
                <p><strong>Platform:</strong> ${device.platform}</p>
                <p><strong>Last Opened:</strong> ${lastOpened.toLocaleString()}</p>
                <label>
                    <input type="checkbox" value="${device.token}">
                    Token: ${device.token.substring(0, 40)}...
                </label>
            </div>
        `;
        deviceListEl.insertAdjacentHTML('beforeend', deviceHtml);
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === platform);
    });
}

async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/history`);
        const history = await response.json();
        historyListEl.innerHTML = '';
        if (history.length === 0) {
            historyListEl.innerHTML = '<li>No notifications sent yet.</li>';
            return;
        }
        history.forEach(item => {
            const li = document.createElement('li');
            const sentDate = item.sentAt._seconds ? new Date(item.sentAt._seconds * 1000) : new Date(item.sentAt);
            li.innerHTML = `
                <strong data-title="${item.title}">${item.title}</strong><br>
                <em data-body="${item.body}">${item.body}</em><br>
                <small>Sent: ${sentDate.toLocaleString()} | Status: ${item.successCount}/${item.deviceCount} successful</small>
                <button class="rerun-btn">Rerun</button>
            `;
            historyListEl.appendChild(li);
        });
    } catch (error) {
        historyListEl.innerHTML = '<li>Error loading history.</li>';
        console.error(error);
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    sendStatusEl.textContent = 'Sending...';
    sendButton.disabled = true;

    const title = document.getElementById('title').value;
    const body = document.getElementById('body').value;
    const selectedCheckboxes = document.querySelectorAll('#device-list input[type="checkbox"]:checked');
    const tokens = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (tokens.length === 0) {
        sendStatusEl.textContent = 'Error: Please select at least one device.';
        sendButton.disabled = false;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/send-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, tokens })
        });
        const result = await response.json();
        sendStatusEl.textContent = result.message || 'Notification sent!';
        form.reset();
        await loadHistory();
    } catch (error) {
        sendStatusEl.textContent = 'Error sending notification.';
        console.error(error);
    } finally {
        sendButton.disabled = false;
    }
});

historyListEl.addEventListener('click', function(e) {
    if (e.target.classList.contains('rerun-btn')) {
        const parentLi = e.target.closest('li');
        const title = parentLi.querySelector('strong').dataset.title;
        const body = parentLi.querySelector('em').dataset.body;

        document.getElementById('title').value = title;
        document.getElementById('body').value = body;

        deselectAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

function selectAll() {
    document.querySelectorAll('#device-list input[type="checkbox"]').forEach(cb => cb.checked = true);
}

function deselectAll() {
    document.querySelectorAll('#device-list input[type="checkbox"]').forEach(cb => cb.checked = false);
}

document.addEventListener('DOMContentLoaded', () => {
    loadDevices();
    loadHistory();
});
