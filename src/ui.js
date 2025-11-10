export function getDOMElements() {
  return {
    chatBox: document.getElementById("chat"),
    input: document.getElementById("user-input"),
    sendBtn: document.getElementById("send-btn"),
    micBtn: document.getElementById("mic-btn"),
    stopBtn: document.getElementById("stop-btn"),
    imagenCharacter: document.getElementById("imagen-character"),
    uploadBtn: document.getElementById("upload-btn"),
    fileInput: document.getElementById("file-input"),
    openChatBtn: document.getElementById("open-chat-btn"),
    chatContainer: document.getElementById("chat-container"),
    closeChatBtn: document.getElementById("close-chat-btn"),
  };
}

export function appendMsg(chatBox, role, content) {
  if (!chatBox) return;
  const div = document.createElement("div");
  div.className = `msg ${role === "Bot" ? "bot" : "user"}`;

  const roleSpan = document.createElement("span");
  roleSpan.textContent = `${role === "Bot" ? "Profe Ana" : "Tú"}: `;
  roleSpan.className = "font-bold";

  const contentSpan = document.createElement("span");
  contentSpan.textContent = content || "";

  div.appendChild(roleSpan);
  div.appendChild(contentSpan);

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

export function typeWriterEffect(element, text, callback) {
  if (!element) return;
  let i = 0;
  const speed = 50;
  function type() {
    if (i < text.length) {
      element.innerHTML = text.substring(0, i + 1) + '<span class="animate-ping">|</span>';
      i++;
      setTimeout(type, speed);
    } else {
      element.innerHTML = text;
      if (callback) callback();
    }
  }
  type();
}

export function setImagen(imagenElement, emocion) {
  if (!imagenElement) return;
  let imagen = "img/normal.png";
  switch (emocion) {
    case "ale": imagen = "img/ale.png"; break;
    case "mot": imagen = "img/ale.png"; break;
    case "cal": imagen = "img/normal.png"; break;
    case "ser": imagen = "img/normal.png"; break;
    case "dud": imagen = "img/tri.png"; break;
    case "pens": imagen = "img/pensando.png"; break;
    default: imagen = "img/normal.png";
  }
  imagenElement.src = imagen;
}

export function setupChatToggle(openChatBtn, chatContainer, closeChatBtn) {
  if (openChatBtn && chatContainer) {
    openChatBtn.addEventListener("click", () => {
      const isHidden = chatContainer.classList.toggle("hidden");
      openChatBtn.style.display = isHidden ? "block" : "none";
    });
    if (closeChatBtn) {
      closeChatBtn.addEventListener("click", () => {
        chatContainer.classList.add("hidden");
        openChatBtn.style.display = "block";
      });
    }
  }
}

export function setupFileInput(uploadBtn, fileInput, fileSelectHandler) {
  if (uploadBtn) uploadBtn.addEventListener("click", () => fileInput?.click());
  if (fileInput) fileInput.addEventListener("change", fileSelectHandler);
}

export function setupMessageHandlers(sendBtn, input, sendMessageHandler) {
  if (sendBtn) sendBtn.onclick = sendMessageHandler;
  if (input) input.onkeydown = (e) => { if (e.key === "Enter") sendMessageHandler(); };
}

export function setupVoiceRecognition(micBtn, stopBtn, onRecognized) {
  const RecognitionClass = window.webkitSpeechRecognition || window.SpeechRecognition || null;
  if (!RecognitionClass) {
    console.warn("SpeechRecognition no disponible en este navegador.");
    if (micBtn) micBtn.disabled = true;
    return;
  }

  const recognition = new RecognitionClass();
  recognition.continuous = true;
  recognition.lang = "es-ES";
  recognition.interimResult = false;

  micBtn.addEventListener("click", () => { recognition.start(); micBtn.style.display = "none"; stopBtn.style.display = "block"; });
  stopBtn.addEventListener("click", () => { recognition.stop(); });
  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    stopBtn.style.display = "none"; micBtn.style.display = "block";
    onRecognized(transcript.trim());
  };
  recognition.onerror = (ev) => console.error("Error reconocimiento:", ev.error);
}