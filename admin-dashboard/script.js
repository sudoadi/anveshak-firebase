// IMPORTANT: Replace with your actual Render backend URL
const API_BASE_URL = 'https://anveshak-firebase.onrender.com';

const deviceListEl = document.getElementById('device-list');
const historyListEl = document.getElementById('history-list');
const form = document.getElementById('notification-form');
const sendStatusEl = document.getElementById('send-status');
const sendButton = document.getElementById('send-button');

// --- Load Initial Data ---
async function loadDevices() {
    try {
        const response = await fetch(`${API_BASE_URL}/devices`);
        const devices = await response.json();
        deviceListEl.innerHTML = '';
        if (devices.length === 0) {
            deviceListEl.innerHTML = 'No devices registered yet.';
            return;
        }
        devices.forEach(device => {
            const container = document.createElement('div');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = device.token;
            checkbox.id = device.token;
            
            const label = document.createElement('label');
            label.htmlFor = device.token;
            label.textContent = `Token: ${device.token.substring(0, 40)}...`;

            container.appendChild(checkbox);
            container.appendChild(label);
            deviceListEl.appendChild(container);
        });
    } catch (error) {
        deviceListEl.innerHTML = 'Error loading devices.';
        console.error(error);
    }
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
                <strong>${item.title}</strong><br>
                <em>${item.body}</em><br>
                <small>Sent: ${sentDate.toLocaleString()} | Status: ${item.successCount}/${item.deviceCount} successful</small>
            `;
            historyListEl.appendChild(li);
        });
    } catch (error) {
        historyListEl.innerHTML = '<li>Error loading history.</li>';
        console.error(error);
    }
}

// --- Form Submission ---
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


// --- Helper Functions ---
function selectAll() {
    document.querySelectorAll('#device-list input[type="checkbox"]').forEach(cb => cb.checked = true);
}

function deselectAll() {
    document.querySelectorAll('#device-list input[type="checkbox"]').forEach(cb => cb.checked = false);
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadDevices();
    loadHistory();
});