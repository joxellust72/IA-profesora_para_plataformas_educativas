import { MLCEngine } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.78/lib/index.min.js";
import { reproducirVoz } from "./services/voiceBoxAPI.js";


    const chatBox = document.getElementById("chat");
    const input = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const micBtn = document.getElementById("mic-btn");
    const stopBtn = document.getElementById("stop-btn");
    const imagenCharacter = document.getElementById("imagen-character");

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "es-ES";
    recognition.interimResult = false;

    let recognizedText = "";
    let engine;
    const model = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

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

    const loadModel = async () => {
      engine = new MLCEngine();
      engine.setInitProgressCallback(console.log);
      appendMsg("Bot", "Inicializando modelo, por favor espera...");
      await engine.reload(model);
      appendMsg("Bot", "Modelo cargado. Puedes empezar a escribir.");
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
      imagenCharacter.src = imagen;
      imagenCharacter.className = "character";
    }

    const sendMessage = async () => {
      setImagen("pensando");
      const userText = input.value.trim();
      if (!userText) return;
      appendMsg("Tú", userText);
      input.value = "";
      chatHistory.push({ role: "user", content: userText });
      saveChatHistory();
      appendMsg("Bot", "Pensando...");
    
      try {
        const stream = await engine.chat.completions.create({
          messages: chatHistory,
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

        await reproducirVoz(botMsg);
        setImagen(emocion);
        const cleanBotMsg = botMsg.slice(5);
        chatBox.lastChild.innerHTML = `<span style="color: purple;">Bot:</span> ${cleanBotMsg}`;
    
      } catch (e) {
        chatBox.lastChild.textContent = "Bot: (Error al responder)";
        console.error(e);
      }
    };

    const sendRecognizedMessage = async () => {
      setImagen("pensando");
      const userText = recognizedText.trim();
      if (!userText) return; 
    
      appendMsg("Tú", userText);
      chatHistory.push({ role: "user", content: userText });
      saveChatHistory();
      appendMsg("Bot", "Pensando...");
    
      try {
        const stream = await engine.chat.completions.create({
          messages: chatHistory,
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
    
        await reproducirVoz(botMsg);
        setImagen(emocion);
        const cleanBotMsg = botMsg.slice(5);
        chatBox.lastChild.innerHTML = `<span style="color: purple;">Bot:</span> ${cleanBotMsg}`;
      } catch (e) {
        chatBox.lastChild.textContent = "Bot: (Error al responder)";
        console.error(e);
      }
    };

    sendBtn.onclick = sendMessage;

    input.onkeydown = (e) => { if (e.key === "Enter") sendMessage(); };


    //Inicializacion del modelo y la carga del historial

    loadModel();
    loadChatHistory();