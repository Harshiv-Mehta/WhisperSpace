
const blockedWords = ["fuck", "motherfucker", "asshole", "lavdu", "chutiya"];

function containsBlockedWord(text) {
  return blockedWords.some(word => text.toLowerCase().includes(word));
}

function getFormattedTime() {
  return new Date().toLocaleString();
}

let db;
if (typeof firebase !== "undefined") {
  db = firebase.database();
}

document.addEventListener("DOMContentLoaded", function () {
  const whisperInput = document.getElementById("whisper");
  const sendBtn = document.getElementById("sendBtn");
  const confirmation = document.getElementById("confirmation");
  const charCount = document.getElementById("charCount");

  if (whisperInput && charCount) {
    whisperInput.addEventListener("input", () => {
      const remaining = 300 - whisperInput.value.length;
      charCount.textContent = `${remaining} characters left`;
    });
  }

  if (sendBtn && whisperInput) {
    sendBtn.addEventListener("click", () => {
      const userWhisper = whisperInput.value.trim();

      if (userWhisper === "") {
        showMessage("Please write something before sending.", true);
        return;
      }

      if (containsBlockedWord(userWhisper)) {
        showMessage("Please keep whispers respectful.", true);
        return;
      }

      const whisperObj = {
        text: userWhisper,
        replies: [],
        timestamp: getFormattedTime()
      };

      db.ref("whispers").push(whisperObj, error => {
        if (error) {
          showMessage("Something went wrong. Try again.", true);
        } else {
          showMessage("Your whisper has been sent into the ether.", false);
          whisperInput.value = "";
          charCount.textContent = "300 characters left";
        }
      });
    });
  }

  function showMessage(msg, isError) {
    confirmation.textContent = msg;
    confirmation.style.color = isError ? "#d9534f" : "#4caf50";
    confirmation.classList.add("show");
    setTimeout(() => {
      confirmation.classList.remove("show");
    }, 3000);
  }
});


document.addEventListener("DOMContentLoaded", function () {
  const whisperWall = document.getElementById("whisperWall");
  const loadingMsg = document.getElementById("loadingMsg");

  if (!whisperWall || !db) return;

  db.ref("whispers").on("value", snapshot => {
    const data = snapshot.val();
    whisperWall.innerHTML = "";

    if (!data) {
      if (loadingMsg) loadingMsg.textContent = "No whispers found.";
      return;
    }

    const whispers = Object.entries(data).map(([key, value]) => ({ key, ...value }));
    whispers.sort(() => Math.random() - 0.5); // Shuffle for anonymity

    whispers.forEach((whisper) => {
      const whisperBlock = document.createElement("div");
      whisperBlock.className = "whisper";

      whisperBlock.innerHTML = `
        <p>🌫️ ${whisper.text}</p>
        <small style="color:#888;">🕒 ${whisper.timestamp || "Unknown time"}</small>
        <textarea placeholder="Reply anonymously..."></textarea>
        <button class="reply-btn">Send Reply</button>
        <button class="delete-whisper">🗑️ Delete Whisper</button>
        <div class="replies">
          ${whisper.replies?.map((r, i) =>
            `<p>💬 ${r} <button class="delete-reply" data-index="${i}">x</button></p>`
          ).join("") || ""}
        </div>
      `;

      const replyBtn = whisperBlock.querySelector(".reply-btn");
      const replyBox = whisperBlock.querySelector("textarea");
      const repliesDiv = whisperBlock.querySelector(".replies");
      const deleteWhisperBtn = whisperBlock.querySelector(".delete-whisper");

     
      replyBtn.addEventListener("click", () => {
        const reply = replyBox.value.trim();
        if (!reply) return;
        if (containsBlockedWord(reply)) {
          alert("Please keep replies respectful.");
          return;
        }
        if ((whisper.replies?.length || 0) >= 5) {
          alert("This whisper has reached its reply limit.");
          return;
        }

        const updatedReplies = whisper.replies || [];
        updatedReplies.push(reply);

        db.ref(`whispers/${whisper.key}`).update({ replies: updatedReplies }, () => {
          const replyElement = document.createElement("p");
          replyElement.innerHTML = `💬 ${reply} <button class="delete-reply" data-index="${updatedReplies.length - 1}">x</button>`;
          repliesDiv.appendChild(replyElement);
          replyBox.value = "";
        });
      });

      
      deleteWhisperBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this whisper?")) {
          db.ref(`whispers/${whisper.key}`).remove();
        }
      });

    
      whisperBlock.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-reply")) {
          const index = parseInt(e.target.dataset.index);
          const updatedReplies = whisper.replies || [];
          updatedReplies.splice(index, 1);
          db.ref(`whispers/${whisper.key}`).update({ replies: updatedReplies });
        }
      });

      whisperWall.appendChild(whisperBlock);
    });

    if (loadingMsg) loadingMsg.style.display = "none";
  });
});
