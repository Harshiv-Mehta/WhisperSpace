const whisperForm = document.getElementById("whisper-form");
const whisperInput = document.getElementById("whisper-input");
const whisperList = document.getElementById("whisper-list");

const API_BASE = "https://whisperspace-backend-gt3e.onrender.com/api/whispers";

// Load whispers from the backend
async function loadWhispers() {
    try {
        const response = await fetch(API_BASE);
        const data = await response.json();
        displayWhispers(data);
    } catch (error) {
        console.error("Failed to load whispers:", error);
    }
}

// Display whispers
function displayWhispers(whispers) {
    whisperList.innerHTML = "";
    whispers.forEach(whisper => {
        const li = document.createElement("li");
        li.className = "whisper";
        li.innerHTML = `
            <p>${whisper.text}</p>
            <small>${new Date(whisper.timestamp).toLocaleString()}</small>
        `;
        whisperList.appendChild(li);
    });
}

// Send whisper to the backend
whisperForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = whisperInput.value.trim();
    if (!text) return;

    try {
        const response = await fetch(API_BASE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            whisperInput.value = "";
            loadWhispers();
        } else {
            console.error("Failed to post whisper");
        }
    } catch (error) {
        console.error("Error posting whisper:", error);
    }
});

// Initial load
loadWhispers();
