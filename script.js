
const blockedWords = ["fuck", "motherfucker", "asshole", "lavdu", "chutiya"];


let db;
if (typeof firebase !== "undefined") {
  db = firebase.database();
}


function containsBlockedWord(text) {
  return blockedWords.some(word => text.toLowerCase().includes(word));
}


function getFormattedTime() {
  const now = new Date();
  return now.toLocaleString();
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
        id: Date.now(),
        text: userWhisper,
        replies: [],
        timestamp: getFormattedTime()
      };

      
      db.ref("whispers").push(whisperObj);

      showMessage("Your whisper has been sent into the ether.", false);
      whisperInput.value = "";
      charCount.textContent = "300 characters left";
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
      loadingMsg.textContent = "No whispers found.";
      return;
    }

    const whispers = Object.entries(data).map(([key, value]) => ({ key, ...value }));
    // Shuffle whispers
    whispers.sort(() => Math.random() - 0.5);

    whispers.forEach((whisper) => {
      const whisperBlock = document.createElement("div");
      whisperBlock.className = "whisper";

      whisperBlock.innerHTML = `
        <p>🌫️ ${whisper.text}</p>
        <small style="color:#888;">🕒 ${whisper.timestamp || "Unknown time"}</small>
        <textarea placeholder="Reply anonymously..."></textarea>
        <button>Send Reply</button>
        <button class="delete-whisper">🗑️ Delete Whisper</button>
        <div class="replies">
          ${whisper.replies?.map((r, i) =>
            `<p>💬 ${r} <button class="delete-reply" data-index="${i}">x</button></p>`
          ).join('') || ''}
        </div>
      `;

      const replyBtn = whisperBlock.querySelector("button");
      const replyBox = whisperBlock.querySelector("textarea");
      const repliesDiv = whisperBlock.querySelector(".replies");
      const deleteWhisperBtn = whisperBlock.querySelector(".delete-whisper");

      // Handle reply
      replyBtn.addEventListener("click", () => {
        const reply = replyBox.value.trim();
        if (!reply) return;
        if (containsBlockedWord(reply)) {
          alert("Please keep replies respectful.");
          return;
        }
        if (whisper.replies?.length >= 5) {
          alert("This whisper has reached its reply limit.");
          return;
        }

        const updatedReplies = whisper.replies || [];
        updatedReplies.push(reply);
        db.ref(`whispers/${whisper.key}`).update({ replies: updatedReplies });

        replyBox.value = "";
      });

      
      deleteWhisperBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this whisper?")) {
          db.ref(`whispers/${whisper.key}`).remove();
        }
      });

      
      const deleteReplyBtns = whisperBlock.querySelectorAll(".delete-reply");
      deleteReplyBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const i = btn.dataset.index;
          const updatedReplies = whisper.replies || [];
          updatedReplies.splice(i, 1);
          db.ref(`whispers/${whisper.key}`).update({ replies: updatedReplies });
        });
      });

      whisperWall.appendChild(whisperBlock);
    });

    loadingMsg.style.display = "none";
  });
});
