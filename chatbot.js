// chatbot.js
function createChatbot() {
  const bot = document.createElement("div");
  bot.innerHTML = `
    <div id="chatbot-box" style="
      position: fixed; bottom: 20px; right: 20px; width: 320px; height: 420px;
      background: white; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.2);
      display: flex; flex-direction: column; overflow: hidden; font-family: Arial, sans-serif; z-index: 9999;">
      <div id="chat-messages" style="flex: 1; padding: 10px; overflow-y: auto;"></div>
      <div style="display: flex; border-top: 1px solid #ddd;">
        <input id="chat-input" placeholder="Ask me anything..." style="flex: 1; border: none; padding: 10px; outline: none;">
        <button id="chat-send" style="background: #007bff; color: white; border: none; padding: 10px 15px;">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(bot);

  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");
  const sendBtn = document.getElementById("chat-send");

  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;
    messages.innerHTML += `<div><b>You:</b> ${msg}</div>`;
    input.value = '';

    // call ChatGPT or public API
    const res = await fetch('https://api.monkedev.com/fun/chat?msg=' + encodeURIComponent(msg));
    const data = await res.json();
    messages.innerHTML += `<div><b>Bot:</b> ${data.response || "I'm thinking..."}</div>`;
    messages.scrollTop = messages.scrollHeight;
  }

  sendBtn.onclick = sendMessage;
  input.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });
}

window.onload = createChatbot;
