let embeddingPipeline = null;
let vectorStore = null;

// Intento robusto de cargar pdfjs y fijar worker
export const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
      } catch (e) {}
      return resolve(window.pdfjsLib);
    }

    const existing = document.querySelector('script[src*="pdf.min.js"]');
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('pdfjs cargado pero pdfjsLib no quedó en window.'));
        }
      });
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.js';
    s.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('pdfjsLib no quedó disponible después de cargar el script.'));
      }
    };
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
};

export const initializeRAG = async (appendFn) => {
  appendFn("Bot", "Preparando mi 'mochila de estudio' (cargando modelo de embeddings)...");
  const pipeline = window.Transformers?.pipeline;
  if (!pipeline) {
    appendFn("Bot", "No pude encontrar Transformers.pipeline en window. Los embeddings no estarán disponibles.");
    return;
  }

  embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  // Voy puede exportar la clase de distintas maneras
  const VoyCandidate = window.Voy?.default || window.Voy?.Voy || window.Voy;
  if (typeof VoyCandidate !== "function") {
    console.warn("Voy export not a constructor:", window.Voy);
    appendFn("Bot", "Aviso: la librería Voy no está disponible como constructor. La búsqueda en documentos estará desactivada.");
    vectorStore = null;
    return;
  }

  try {
    vectorStore = new VoyCandidate();
    appendFn("Bot", "¡Lista para aprender! Puedes subir un documento cuando quieras.");
  } catch (err) {
    console.error("No se pudo instanciar Voy:", err);
    appendFn("Bot", "No pude inicializar el almacenamiento de apuntes. La funcionalidad de documentos quedará desactivada.");
    vectorStore = null;
  }
};

// handler para carga de archivos (usa embeddingPipeline y vectorStore internos)
export const handleFileSelect = async (event, appendFn, setImagenFn) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!embeddingPipeline || !vectorStore) {
    appendFn("Bot", "Espera un momento, todavía estoy preparando mis herramientas de estudio.");
    return;
  }

  appendFn("Bot", `Estudiando el documento: ${file.name}...`);
  setImagenFn("pens");

  try {
    let text = "";
    if (file.type === "application/pdf") {
      const pdfjs = window.pdfjsLib;
      const pdf = await pdfjs.getDocument(URL.createObjectURL(file)).promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(" ");
      }
    } else {
      text = await file.text();
    }

    const chunks = text.match(/[^.!?]+[.!?]+(\s|$)|\S+/g) || [];
    appendFn("Bot", `He dividido el documento en ${chunks.length} partes para analizarlo mejor.`);

    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.trim().length < 10) continue;
      const embedding = await embeddingPipeline(chunk, { pooling: 'mean', normalize: true });
      embeddings.push({
        id: `chunk-${i}`,
        title: `Parte ${i+1}`,
        text: chunk,
        embedding: embedding.data,
      });
    }

    if (vectorStore && typeof vectorStore.add === "function") {
      vectorStore.add(embeddings);
      appendFn("Bot", `¡Listo! He terminado de estudiar el documento. Ahora puedes hacerme preguntas sobre su contenido.`);
      setImagenFn("ale");
    } else {
      appendFn("Bot", "No pude guardar los apuntes porque la base vectorial no está disponible.");
      setImagenFn("dud");
    }
  } catch (error) {
    console.error("Error procesando el archivo:", error);
    appendFn("Bot", "¡Uy! Tuve un problema al intentar leer ese archivo. ¿Podrías intentarlo de nuevo?");
    setImagenFn("dud");
  }
};