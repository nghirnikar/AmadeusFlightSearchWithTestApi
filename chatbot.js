// chatbot.js
function createChatbot() {
  // --- Create main chat container ---
  const chatContainer = document.createElement("div");
  chatContainer.id = "chat-container";
  chatContainer.innerHTML = `
    <div id="chat-header" style="
      background:#007bff; color:white; padding:10px; cursor:pointer;
      display:flex; align-items:center; justify-content:space-between;
      border-top-left-radius:10px; border-top-right-radius:10px;">
      <span>💬 AirBooking Assistant</span>
      <span id="chat-toggle" style="font-weight:bold;">−</span>
    </div>
    <div id="chat-body" style="
      display:flex; flex-direction:column; height:370px; background:white;">
      <div id="chat-messages" style="
        flex:1; padding:10px; overflow-y:auto; font-family:Arial,sans-serif;
        font-size:14px;"></div>
      <div style="display:flex; border-top:1px solid #ddd;">
        <input id="chat-input" placeholder="Type your message..."
          style="flex:1; border:none; padding:10px; outline:none;">
        <button id="chat-send" style="
          background:#007bff; color:white; border:none; padding:10px 15px;">Send</button>
      </div>
    </div>
  `;
  chatContainer.style = `
    position:fixed; bottom:20px; right:20px; width:320px; height:420px;
    border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.2); overflow:hidden;
    font-family:Arial,sans-serif; z-index:9999;
  `;
  document.body.appendChild(chatContainer);

  const messages = document.getElementById("chat-messages");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const header = document.getElementById("chat-header");
  const chatBody = document.getElementById("chat-body");
  const toggle = document.getElementById("chat-toggle");

  // --- Toggle (minimize/maximize) ---
  header.addEventListener("click", () => {
    if (chatBody.style.display === "none") {
      chatBody.style.display = "flex";
      toggle.textContent = "−";
    } else {
      chatBody.style.display = "none";
      toggle.textContent = "+";
    }
  });

  // --- Message send logic ---
  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;
    messages.innerHTML += `<div><b>You:</b> ${msg}</div>`;
    input.value = "";

    const res = await fetch(
      "https://api.monkedev.com/fun/chat?msg=" + encodeURIComponent(msg)
    );
    const data = await res.json();

    messages.innerHTML += `<div><b>Bot:</b> ${data.response || "I'm thinking..."}</div>`;
    messages.scrollTop = messages.scrollHeight;
  }

  sendBtn.onclick = sendMessage;
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

window.addEventListener("load", createChatbot);
