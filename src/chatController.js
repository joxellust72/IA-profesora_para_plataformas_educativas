import { systemPrompt } from "../ConfigAI.JS";
import { runChatCompletion } from "./engine.js";
import { reproducirVoz } from "../services/voiceBoxAPI.js";
import { handleFileSelect as ragFileSelect, initializeRAG } from "./rag.js";
import { loadProfile, addMessagesToHistory, updateProfile } from "./profileManager.js";
import { appendMsg, setImagen, typeWriterEffect } from "./ui.js";

let chatHistory = [];
let isEngineReady = false;

function obtenerEmocion(mensaje) {
  if (!mensaje || mensaje.length < 4) return "cal";
  return mensaje.slice(1, 4);
}

function parseAndHandleLearningStyle(botMsg) {
  const styleRegex = /\[STYLE:(\w+)\]/;
  const match = botMsg.match(styleRegex);

  if (match && match[1]) {
    const newStyle = match[1];
    console.log(`Estilo de aprendizaje detectado: ${newStyle}`);
    updateProfile({ learningStyle: newStyle }); // Esta llamada ahora es asíncrona, pero no necesitamos esperar
  }
}

export async function loadChatHistory(chatBox) {
  const studentProfile = await loadProfile();
  chatHistory = [systemPrompt];

  if (studentProfile.chatHistory) {
    chatHistory.push(...studentProfile.chatHistory);
  }

  if (chatBox && chatHistory.length > 1) {
    chatBox.innerHTML = "";
    chatHistory.slice(1).forEach(m => appendMsg(chatBox, m.role === "assistant" ? "Bot" : "Tú", m.content));
  }
}

export async function handleUserMessage(userText, ui) {
  if (!userText) return;
  if (!isEngineReady) {
    appendMsg(ui.chatBox, "Bot", "<cal>¡Un momento! Todavía estoy cargando mi cerebro. Por favor, espera a que termine.");
    setImagen(ui.imagenCharacter, "dud");
    return;
  }

  setImagen(ui.imagenCharacter, "pensando");
  appendMsg(ui.chatBox, "Tú", userText);
  
  const userMessage = { role: "user", content: userText };
  chatHistory.push(userMessage);
  await addMessagesToHistory([userMessage]);

  const thinkingMsg = appendMsg(ui.chatBox, "Bot", "Pensando...");

  try {
    const botMsg = await runChatCompletion(chatHistory);
    const emocion = obtenerEmocion(botMsg);

    // Procesamos la respuesta para buscar y manejar el estilo de aprendizaje
    parseAndHandleLearningStyle(botMsg);

    const botMessage = { role: "assistant", content: botMsg };
    chatHistory.push(botMessage);
    await addMessagesToHistory([botMessage]);

    thinkingMsg.remove();

    const cleanBotMsg = botMsg.slice(5);
    const botMsgElementContainer = appendMsg(ui.chatBox, "Bot", "");
    const botMessageElement = botMsgElementContainer.querySelector("span:last-child");
    if (botMsgElementContainer.classList.contains("bot")) botMessageElement.classList.add("chalk-font");

    reproducirVoz(botMsg);
    setImagen(ui.imagenCharacter, emocion);
    typeWriterEffect(botMessageElement, cleanBotMsg);
  } catch (e) {
    if (thinkingMsg) thinkingMsg.querySelector("span:last-child").textContent = "(Error al responder)";
    console.error(e);
  }
}

export function setEngineReady(status) {
  isEngineReady = status;
}

export async function initializeChat(ui) {
  const append = (role, content) => appendMsg(ui.chatBox, role, content);
  
  append("Bot", "Inicializando modelo, por favor espera...");
  
  await initializeRAG(append);

  await loadChatHistory(ui.chatBox);
}

export function handleFileSelect(event, ui) {
  const append = (role, content) => appendMsg(ui.chatBox, role, content);
  const setImg = (emocion) => setImagen(ui.imagenCharacter, emocion);
  ragFileSelect(event, append, setImg);
}