import { MLCEngine } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.78/lib/index.min.js";
import { model } from "../ConfigAI.JS";

let engine;

/**
 * Inicializa y carga el modelo de lenguaje.
 * @param {function(string): void} progressCallback - Función para reportar el progreso de inicialización.
 * @returns {Promise<MLCEngine>} La instancia del motor.
 */
export const initializeEngine = async (progressCallback) => {
  engine = new MLCEngine();
  engine.setInitProgressCallback((info) => {
    try {
      const p = info.progress ?? null;
      if (typeof p === "number") {
        if (p % 10 === 0 || p === 100) progressCallback(info.text);
      } else {
        progressCallback(info.text);
      }
    } catch (e) {
      console.log(info);
    }
  });

  await engine.reload(model);
  return engine;
};

/**
 * Ejecuta la petición al motor y devuelve el texto final del asistente.
 * @param {Array<object>} messages - Array de mensajes (chatHistory).
 * @returns {Promise<string>} La respuesta del bot.
 */
export async function runChatCompletion(messages) {
  if (!engine) throw new Error("El motor no ha sido inicializado.");

  const stream = await engine.chat.completions.create({
    messages,
    stream: true,
  });

  let botMsg = "";
  for await (const response of stream) {
    botMsg += response.choices[0]?.delta?.content || "";
  }
  return botMsg;
}