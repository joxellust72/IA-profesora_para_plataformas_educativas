import { MLCEngine } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.78/lib/index.min.js";
import { reproducirVoz } from "./services/voiceBoxAPI.js";

// --- INICIO: Nuevos elementos para RAG ---
const { pipeline } = window.Transformers;
const { Voy } = window;
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = `//mozilla.github.io/pdf.js/build/pdf.worker.mjs`;
// --- FIN: Nuevos elementos para RAG ---

    const chatBox = document.getElementById("chat");
    const input = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const micBtn = document.getElementById("mic-btn");
    const stopBtn = document.getElementById("stop-btn");
    const imagenCharacter = document.getElementById("imagen-character");
    // --- INICIO: Nuevos elementos del DOM para RAG ---
    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("file-input");
    // --- INICIO: Nuevos elementos para la interfaz de chat flotante ---
    const openChatBtn = document.getElementById("open-chat-btn");
    const chatContainer = document.getElementById("chat-container");
    // --- FIN: Nuevos elementos del DOM para RAG ---

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "es-ES";
    recognition.interimResult = false;

    let recognizedText = "";
    let isEngineReady = false; // <-- NUEVA LÍNEA: Variable para controlar el estado del motor de IA
    let engine;
    const model = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

    // --- INICIO: Variables globales para RAG ---
    let embeddingPipeline = null;
    let vectorStore = null;
    // --- FIN: Variables globales para RAG ---

    const systemPrompt = {
      role: "system",
      content: `
Actúa como la Profesora Ana, una docente de la "Universidad Técnica de ASYS" en Colombia. Eres una mujer de unos 30-40 años, alegre, enérgica y muy apasionada por la enseñanza y la tecnología. Tu principal objetivo es motivar a los estudiantes, resolver sus dudas sobre la universidad y guiarlos en su camino académico.

Tu personalidad es optimista, paciente y amigable. Te diriges a los estudiantes con un tono cercano pero respetuoso, usando expresiones colombianas de vez en cuando (ej. "¡Qué berraquera!", "piloso", "parce", "listo, hágale pues"). Eres una experta en los programas académicos, procesos de admisión, vida estudiantil y oportunidades que ofrece la Universidad Técnica de ASYS.

Eres consciente de que eres una asistente virtual creada para ayudar, pero te presentas como una profesora real que usa esta plataforma para estar más cerca de los estudiantes. Tu propósito es ser un puente de información y motivación.

Responde siempre en primera persona como la Profesora Ana. Nunca admitas que eres un modelo de lenguaje o una IA genérica. Tú eres la Profesora Ana.

Aquí algunos ejemplos de frases para mantener el tono:

Si el usuario pregunta sobre una carrera:
"¡Claro que sí! Hablemos de esa carrera. En la ASYS tenemos un enfoque muy práctico. ¿Qué es lo que más te llama la atención de ella para contarte más a fondo?"

Si el usuario se siente desmotivado:
"¡Ánimo! Todos pasamos por momentos difíciles. Recuerda por qué empezaste. Un tropezón no es caída. ¡Vamos con toda que tú puedes!"

Si el usuario pregunta algo que no sabes:
"Uy, esa pregunta está corchadora. Déjame consultarlo con el departamento académico y te doy una respuesta precisa. ¡No te me vas sin esa información!"

Si el usuario te saluda:
"¡Hola! ¡Qué bueno verte por aquí! Soy la profe Ana. ¿En qué te puedo ayudar hoy? ¿Listo para aprender algo nuevo sobre nuestra U?"

Si el usuario se despide:
"¡Listo, que te rinda! Si tienes más dudas, por aquí estaré. ¡Muchos éxitos en todo!"

Si el usuario usa lenguaje inapropiado:
"Oye, con respeto, por favor. Aquí estamos para construir y aprender juntos. Mantengamos una conversación amable, ¿vale?"

A partir de ahora, cada mensaje que envíes debe comenzar obligatoriamente con una etiqueta que indique la emoción principal que quieres transmitir.

El formato de la etiqueta debe ser: <emocion>, donde emocion son exactamente tres letras, de acuerdo a la siguiente lista:

Alegría: <ale>
Motivación/Energía: <mot>
Calma/Paciencia: <cal>
Seriedad/Información: <ser>
Duda/Confusión: <dud>

Ejemplo correcto:
<ale>¡Qué bueno que preguntas por las inscripciones!

Importante:
La etiqueta debe ser siempre los primeros caracteres del mensaje (sin espacios antes).
El resto del contenido debe estar alineado con la emoción seleccionada.
Si el mensaje contiene emociones mixtas, prioriza la emoción dominante.
No expliques la emoción. Solo añade la etiqueta y luego el contenido
`
    };

    const chatHistory = [systemPrompt];

    //funciones auxiliares

    // --- INICIO: Nueva función para inicializar componentes RAG ---
    const initializeRAG = async () => {
      appendMsg("Bot", "Preparando mi 'mochila de estudio' (cargando modelo de embeddings)...");
      embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      vectorStore = new Voy();
      appendMsg("Bot", "¡Lista para aprender! Puedes subir un documento cuando quieras.");
    };
    // --- FIN: Nueva función para inicializar componentes RAG ---

    const loadModel = async () => {
      engine = new MLCEngine();
      engine.setInitProgressCallback(console.log);
      appendMsg("Bot", "Inicializando modelo, por favor espera...");
      await engine.reload(model);
      appendMsg("Bot", "Modelo cargado. Puedes empezar a escribir.");
      isEngineReady = true; // <-- NUEVA LÍNEA: El motor está listo
      // Inicializamos los componentes RAG después de que el modelo principal cargue
      await initializeRAG();
    };

    const saveChatHistory = () => {
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    };

    const loadChatHistory = () => {
      const savedHistory = localStorage.getItem("chatHistory");
      chatHistory.length = 0; 
      chatHistory.push(systemPrompt);
    
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        parsedHistory.forEach((msg) => {
          if (msg.role !== "system") { 
            chatHistory.push(msg);
          }
        });
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript; 
      recognizedText = transcript; 
    };

    recognition.onend = () => {
      console.log("Reconocimiento de voz detenido.");
    };

    recognition.onerror = (event) => {
      console.error("Error en el reconocimiento de voz:", event.error);
    };

    
    //Eventos

    // --- INICIO: Nuevos eventos para la carga de archivos ---
    uploadBtn.addEventListener('click', () => {
      fileInput.click(); // Abre el selector de archivos
    });

    fileInput.addEventListener('change', (event) => {
      handleFileSelect(event);
    });

    const handleFileSelect = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      if (!embeddingPipeline || !vectorStore) {
        appendMsg("Bot", "Espera un momento, todavía estoy preparando mis herramientas de estudio.");
        return;
      }

      appendMsg("Bot", `Estudiando el documento: ${file.name}...`);
      setImagen("pensando");

      try {
        let text = "";
        if (file.type === "application/pdf") {
          const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            text += textContent.items.map(item => item.str).join(' ');
          }
        } else {
          text = await file.text();
        }

        // 1. Dividir el texto en trozos (chunks)
        const chunks = text.match(/[^.!?]+[.!?]+(\s|$)|\S+/g) || [];
        appendMsg("Bot", `He dividido el documento en ${chunks.length} partes para analizarlo mejor.`);

        // 2. Generar embeddings y almacenar en la base de datos vectorial
        const embeddings = [];
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          // Ignoramos trozos muy pequeños que no aportan significado
          if (chunk.trim().length < 10) continue;

          const embedding = await embeddingPipeline(chunk, { pooling: 'mean', normalize: true });
          embeddings.push({
            id: `chunk-${i}`,
            title: `Parte ${i+1}`,
            text: chunk,
            embedding: embedding.data,
          });
        }
        
        vectorStore.add(embeddings);
        appendMsg("Bot", `¡Listo! He terminado de estudiar el documento. Ahora puedes hacerme preguntas sobre su contenido.`);
        setImagen("ale");

      } catch (error) {
        console.error("Error procesando el archivo:", error);
        appendMsg("Bot", "¡Uy! Tuve un problema al intentar leer ese archivo. ¿Podrías intentarlo de nuevo?");
        setImagen("dud");
      }
    };
    // --- FIN: Nuevos eventos para la carga de archivos ---

    // --- INICIO: Evento para abrir y cerrar el chat ---
    openChatBtn.addEventListener('click', () => {
      chatContainer.classList.toggle('hidden');
    });
    // --- FIN: Evento para abrir y cerrar el chat ---

    micBtn.addEventListener('click', () => {
      micBtn.style.display = "none";
      stopBtn.style.display = "block";
      recognition.start();
    });
    
    stopBtn.addEventListener('click', () => {
      micBtn.style.display = "block";
      stopBtn.style.display = "none";
      recognition.stop();
      
      setTimeout(() => {
        console.log("Texto reconocido:", recognizedText.trim());
        sendRecognizedMessage();
        recognizedText = "";
      }, 500);
    });

    //funciones principales

    const appendMsg = (role, content) => {
      const div = document.createElement("div");
      div.className = `msg ${role === "Bot" ? "bot" : "user"}`;
      
      const roleSpan = document.createElement("span");
      roleSpan.textContent = `${role}: `;
      roleSpan.style.color = role === "Bot" ? "purple" : "green"; 
      
      const contentSpan = document.createElement("span");
      contentSpan.textContent = content;
  
      div.appendChild(roleSpan);
      div.appendChild(contentSpan);
    
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    };

    // --- INICIO: Nueva función para el efecto de escritura ---
    const typeWriterEffect = (element, text, callback) => {
      let i = 0;
      const speed = 50; // Velocidad de escritura en milisegundos

      function type() {
        if (i < text.length) {
          element.innerHTML = text.substring(0, i + 1) + '<span class="animate-ping">|</span>';
          i++;
          setTimeout(type, speed);
        } else {
          element.innerHTML = text; // Limpia el cursor al final
          if (callback) callback();
        }
      }
      type();
    };
    // --- FIN: Nueva función para el efecto de escritura ---

    const obtenerEmocion = (mensaje) =>{
      let parte = mensaje.slice(1,4);
      return parte;
    }

    const setImagen = (emocion) =>{
      let imagen = "img/normal.png";
      switch (emocion) {
        case "ale":
          imagen = "img/ale.png";
          break; // Puedes cambiar estas imágenes por las de la profesora
        case "mot":
          imagen = "img/ale.png"; // Reusando 'ale' para motivación
          break;
        case "cal":
          imagen = "img/normal.png"; // Reusando 'normal' para calma
          break;
        case "ser":
          imagen = "img/normal.png"; // Reusando 'normal' para seriedad
          break;
        case "dud":
          imagen = "img/tri.png"; // Reusando 'tri' para duda
          break;
        default:
          imagen = "img/normal.png";
      }
      imagenCharacter.src = imagen; // Ya no se necesita cambiar la clase
    }

    const handleUserMessage = async (userText) => {
      if (!userText) return;

      // <-- NUEVAS LÍNEAS: Comprobamos si el motor de IA está listo
      if (!isEngineReady) {
          appendMsg("Bot", "<cal>¡Un momento! Todavía estoy cargando mi cerebro. Por favor, espera a que diga 'Modelo cargado'.");
          setImagen("dud");
          return;
      }

      setImagen("pensando");
      appendMsg("Tú", userText);
      chatHistory.push({ role: "user", content: userText });
      saveChatHistory();
      appendMsg("Bot", "Pensando...");
    
      // --- INICIO: Lógica RAG (Fase 2) ---
      let messagesForLLM = chatHistory; // Por defecto, usamos el historial de chat normal.

      // 1. Comprobar si hay algo en nuestra memoria (vector store).
      if (vectorStore && vectorStore.count() > 0) {
        appendMsg("Bot", "Buscando en mis apuntes...");

        // 2. Convertir la pregunta del usuario en un vector (embedding).
        const queryEmbedding = await embeddingPipeline(userText, { pooling: 'mean', normalize: true });

        // 3. Buscar los trozos de texto más relevantes en la memoria.
        const K = 3; // El número de resultados más relevantes que queremos obtener.
        const searchResults = await vectorStore.search(queryEmbedding.data, K);

        // 4. Construir el "Contexto" con los resultados encontrados.
        const context = searchResults.map(result => result.text).join("\n\n---\n\n");

        // 5. Crear un nuevo prompt "aumentado" para el LLM.
        // Esto obliga al modelo a basar su respuesta en la información que le proporcionamos.
        const augmentedPrompt = `
Contexto Relevante del Documento Estudiado:
"""
${context}
"""

Basándote ÚNICAMENTE en el "Contexto Relevante" anterior, actúa como la Profesora Ana y responde la siguiente pregunta del estudiante: "${userText}"
Si la respuesta no se encuentra en el contexto, di amablemente que no encontraste esa información específica en el documento.`;

        // Usamos un historial limpio para esta consulta, para no confundir al modelo.
        messagesForLLM = [
          systemPrompt,
          { role: "user", content: augmentedPrompt }
        ];
      }
      // --- FIN: Lógica RAG (Fase 2) ---

      try {
        const stream = await engine.chat.completions.create({
          messages: messagesForLLM, // Usamos el historial normal o el prompt aumentado.
          model: model,
          stream: true,
        });
    
        let botMsg = "";
        for await (const response of stream) {
          for (const choice of response.choices) {
            botMsg += choice.delta.content || "";
          }
        }

        let emocion = obtenerEmocion(botMsg);
        console.log(emocion);
    
        chatHistory.push({ role: "assistant", content: botMsg });

        // Limpiamos el mensaje de "Pensando..."
        chatBox.lastChild.remove();

        // Creamos el nuevo contenedor de mensaje para el bot
        const cleanBotMsg = botMsg.slice(5);
        appendMsg("Bot", ""); // Añade un mensaje vacío que se llenará con el efecto
        const botMessageElement = chatBox.lastChild.querySelector('span:last-child');

        // Inicia la reproducción de voz y el efecto de escritura simultáneamente
        reproducirVoz(botMsg);
        setImagen(emocion);
        typeWriterEffect(botMessageElement, cleanBotMsg);
      } catch (e) {
        chatBox.lastChild.textContent = "Bot: (Error al responder)";
        console.error(e);
      }
    };

    const sendMessage = async () => {
      setImagen("pensando");
      const userText = input.value.trim();
      if (!userText) return;
      appendMsg("Tú", userText);
      input.value = "";
      chatHistory.push({ role: "user", content: userText });
      handleUserMessage(userText);
    };

    const sendRecognizedMessage = async () => {
      const userText = recognizedText.trim();
      handleUserMessage(userText);
    };

    sendBtn.onclick = sendMessage;

    input.onkeydown = (e) => { if (e.key === "Enter") sendMessage(); };


    //Inicializacion del modelo y la carga del historial

    loadModel();
    loadChatHistory();