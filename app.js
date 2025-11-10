import { initializeEngine } from "./src/engine.js";
import { loadPdfJs } from "./src/rag.js";
import {
  getDOMElements,
  appendMsg,
  setupChatToggle,
  setupFileInput,
  setupMessageHandlers,
  setupVoiceRecognition,
} from "./src/ui.js";
import {
  handleUserMessage,
  setEngineReady,
  initializeChat,
  handleFileSelect,
  loadChatHistory,
} from "./src/chatController.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Carga de dependencias en segundo plano
  loadPdfJs().catch((e) => console.warn("No se pudo cargar pdfjs:", e));

  // Obtener elementos del DOM
  const ui = getDOMElements();

  // Inicializar chat y cargar historial
  await initializeChat(ui); // Esta línea ya estaba bien, solo confirmando.

  // Configurar manejadores de eventos de la UI
  setupChatToggle(ui.openChatBtn, ui.chatContainer, ui.closeChatBtn);
  setupFileInput(ui.uploadBtn, ui.fileInput, (event) => handleFileSelect(event, ui));
  setupMessageHandlers(ui.sendBtn, ui.input, () => {
    const userText = ui.input.value.trim();
    if (userText) {
      ui.input.value = "";
      handleUserMessage(userText, ui);
    }
  });
  setupVoiceRecognition(ui.micBtn, ui.stopBtn, (text) => handleUserMessage(text, ui));

  // Inicializar el motor y actualizar el estado
  await initializeEngine((progressText) => appendMsg(ui.chatBox, "Bot", progressText));
  setEngineReady(true);
  appendMsg(ui.chatBox, "Bot", "Modelo cargado. Puedes empezar a escribir.");
});