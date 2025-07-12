

document.addEventListener("DOMContentLoaded", function () {
  const whisperInput = document.getElementById("whisper");
  const sendBtn = document.getElementById("sendBtn");
  const confirmation = document.getElementById("confirmation");
  const whisperWall = document.getElementById("whisperWall");
  const loadingMsg = document.getElementById("loadingMsg");
  const charCount = document.getElementById("charCount");
  const toggleTheme = document.getElementById("toggleTheme");

  const blockedWords = ["fuck", "motherfucker", "asshole", "lavdu", "chutiya"];

  function containsBlockedWord(text) {
    return blockedWords.some(word => text.toLowerCase().includes(word));
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  
  if (toggleTheme) {
    toggleTheme.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
    });

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
    }
  }

 
  if (whisperInput && charCount) {
    whisperInput.addEventListener("input", () => {
      charCount.textContent = `${whisperInput.value.length}/300`;
    });
  }

 
  if (sendBtn && whisperInput && confirmation) {
    sendBtn.addEventListener("click", function () {
      const userWhisper = whisperInput.value.trim();

      if (userWhisper === "") {
        confirmation.textContent = "Please write something before sending.";
        confirmation.style.color = "#d9534f";
        confirmation.classList.add("show");
        return;
      }

      if (containsBlockedWord(userWhisper)) {
        confirmation.textContent = "Please keep whispers respectful.";
        confirmation.style.color = "#d9534f";
        confirmation.classList.add("show");
        return;
      }

      let whispers = JSON.parse(localStorage.getItem("whispers")) || [];
      const whisperObj = {
        id: Date.now(),
        text: userWhisper,
        replies: [],
        timestamp: Date.now()
      };
      whispers.push(whisperObj);
      localStorage.setItem("whispers", JSON.stringify(whispers));

      confirmation.textContent = "Your whisper has been sent into the ether.";
      confirmation.style.color = "#4caf50";
      confirmation.classList.add("show");
      whisperInput.value = "";
      charCount.textContent = "0/300";

      setTimeout(() => {
        confirmation.classList.remove("show");
      }, 3000);
    });
  }

  
  if (whisperWall) {
    let whispers = JSON.parse(localStorage.getItem("whispers")) || [];

    if (whispers.length === 0) {
      whisperWall.innerHTML = "<p style='text-align:center; color:#777;'>No whispers yet. Try adding one from the main page.</p>";
    } else {
      whispers = whispers.sort(() => Math.random() - 0.5);

      whispers.forEach((whisper, index) => {
        const whisperBlock = document.createElement("div");
        whisperBlock.className = "whisper";

        const repliesHTML = whisper.replies.map((reply, replyIndex) => `
          <p>💬 ${reply}
            <button class="delete-reply" data-whisper="${index}" data-reply="${replyIndex}" title="Delete reply">🗑️</button>
          </p>
        `).join('');

        whisperBlock.innerHTML = `
          <p>🌫️ ${whisper.text}</p>
          <small>🕒 ${formatTime(whisper.timestamp)}</small>
          <textarea placeholder="Reply anonymously..."></textarea>
          <button class="send-reply">Send Reply</button>
          <div class="replies">${repliesHTML}</div>
          <button class="delete-whisper" data-index="${index}" title="Delete whisper">🗑️ Delete Whisper</button>
        `;

        const replyBtn = whisperBlock.querySelector(".send-reply");
        const replyBox = whisperBlock.querySelector("textarea");
        const repliesDiv = whisperBlock.querySelector(".replies");

        replyBtn.addEventListener("click", function () {
          const reply = replyBox.value.trim();
          if (reply === "") return;

          if (containsBlockedWord(reply)) {
            alert("Please keep replies respectful.");
            return;
          }

          if (whispers[index].replies.length >= 5) {
            alert("This whisper has reached its reply limit.");
            return;
          }

          whispers[index].replies.push(reply);
          localStorage.setItem("whispers", JSON.stringify(whispers));

          const replyPara = document.createElement("p");
          replyPara.innerHTML = `💬 ${reply} <button class="delete-reply" data-whisper="${index}" data-reply="${whispers[index].replies.length - 1}" title="Delete reply">🗑️</button>`;
          repliesDiv.appendChild(replyPara);
          replyBox.value = "";
        });

        const deleteWhisperBtn = whisperBlock.querySelector(".delete-whisper");
        deleteWhisperBtn.addEventListener("click", function () {
          if (confirm("Delete this whisper and all its replies?")) {
            whispers.splice(index, 1);
            localStorage.setItem("whispers", JSON.stringify(whispers));
            location.reload();
          }
        });

        whisperWall.appendChild(whisperBlock);
      });

      whisperWall.addEventListener("click", function (e) {
        if (e.target.classList.contains("delete-reply")) {
          const wIndex = parseInt(e.target.dataset.whisper);
          const rIndex = parseInt(e.target.dataset.reply);
          if (confirm("Delete this reply?")) {
            whispers[wIndex].replies.splice(rIndex, 1);
            localStorage.setItem("whispers", JSON.stringify(whispers));
            location.reload();
          }
        }
      });
    }

    if (loadingMsg) loadingMsg.style.display = "none";
  }
});
