// chatbot.js
function createChatbot() {
  // Create floating chat button 💬
  const chatButton = document.createElement("div");
  chatButton.id = "chat-button";
  chatButton.innerHTML = "💬";
  chatButton.style = `
    position:fixed; bottom:25px; right:25px;
    width:60px; height:60px; background:#007bff;
    color:white; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:28px; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3);
    z-index:9999;
  `;
  document.body.appendChild(chatButton);

  // Create chat window (hidden by default)
  const chatWindow = document.createElement("div");
  chatWindow.id = "chat-window";
  chatWindow.innerHTML = `
    <div id="chat-header" style="
      background:#007bff; color:white; padding:10px;
      border-top-left-radius:10px; border-top-right-radius:10px;
      display:flex; justify-content:space-between; align-items:center;">
      <span>AirBooking Assistant</span>
      <button id="chat-close" style="
        background:none; border:none; color:white; font-size:20px; cursor:pointer;">×</button>
    </div>
    <div id="chat-body" style="display:flex; flex-direction:column; height:360px; background:white;">
      <div id="chat-messages" style="flex:1; padding:10px; overflow-y:auto; font-family:Arial; font-size:14px;"></div>
      <div style="display:flex; border-top:1px solid #ddd;">
        <input id="chat-input" placeholder="Type a message..." style="flex:1; border:none; padding:10px; outline:none;">
        <button id="chat-send" style="background:#007bff; color:white; border:none; padding:10px 15px;">Send</button>
      </div>
    </div>
  `;
  chatWindow.style = `
    position:fixed; bottom:90px; right:25px; width:320px; height:420px;
    border-radius:10px; box-shadow:0 0 15px rgba(0,0,0,0.3);
    overflow:hidden; font-family:Arial,sans-serif;
    display:none; z-index:9999;
  `;
  document.body.appendChild(chatWindow);

  // Elements
  const closeBtn = document.getElementById("chat-close");
  const sendBtn = document.getElementById("chat-send");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");

  // Toggle open/close
  chatButton.onclick = () => {
    chatWindow.style.display = "block";
    chatButton.style.display = "none";
  };
  closeBtn.onclick = () => {
    chatWindow.style.display = "none";
    chatButton.style.display = "flex";
  };

  // Send message logic
  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;
    messages.innerHTML += `<div><b>You:</b> ${msg}</div>`;
    input.value = "";
    messages.scrollTop = messages.scrollHeight;

    const res = await fetch(`https://api.monkedev.com/fun/chat?msg=${encodeURIComponent(msg)}`);
    const data = await res.json();
    messages.innerHTML += `<div><b>Bot:</b> ${data.response || "I'm thinking..."}</div>`;
    messages.scrollTop = messages.scrollHeight;
  }

  sendBtn.onclick = sendMessage;
  input.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });
}

window.addEventListener("load", createChatbot);
