const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const DB_PATH = path.join(__dirname, 'student_data.json');

// --- Funciones de Ayuda para la "Base de Datos" (copiadas de server.js) ---

async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(DB_PATH, JSON.stringify({}));
      return {};
    }
    throw error;
  }
}

async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// --- Definición de los 4 Endpoints Obligatorios ---

/**
 * ENDPOINT 1: Obtener Perfil y Historial del Estudiante
 * GET /student/:studentId
 */
router.get('/student/:studentId', async (req, res) => {
  // 1. Extraemos el ID del estudiante de los parámetros de la URL.
  const { studentId } = req.params;
  // 2. Leemos el contenido de nuestro archivo JSON que funciona como base de datos.
  const db = await readDB();

  // 3. Verificamos si ya existe un perfil para este estudiante.
  if (db[studentId]) {
    // 3a. Si existe, lo devolvemos como respuesta en formato JSON.
    res.json(db[studentId]);
  } else {
    // 3b. Si no existe, creamos un perfil nuevo por defecto.
    const defaultProfile = {
      id: studentId,
      name: "Estudiante Piloto",
      course: "Introducción a la IA",
      learningStyle: "desconocido",
      chatHistory: []
    };
    // 4. Añadimos el nuevo perfil a nuestro objeto de base de datos.
    db[studentId] = defaultProfile;
    // 5. Guardamos el objeto actualizado de vuelta en el archivo JSON.
    await writeDB(db);
    // 6. Devolvemos el perfil recién creado con un código de estado 201 (Creado).
    res.status(201).json(defaultProfile);
  }
});

/**
 * ENDPOINT 2: Guardar un Nuevo Mensaje en el Historial
 * POST /student/:studentId/messages
 */
router.post('/student/:studentId/messages', async (req, res) => {
  // 1. Extraemos el ID del estudiante de la URL y los mensajes del cuerpo de la petición.
  const { studentId } = req.params;
  const { messages } = req.body;
  // 2. Leemos la base de datos.
  const db = await readDB();

  // 3. Verificamos que el estudiante exista y que se hayan enviado mensajes.
  if (db[studentId] && messages) {
    // 4. Añadimos los nuevos mensajes al final del historial de chat existente.
    db[studentId].chatHistory.push(...messages);
    // 5. Guardamos los cambios en el archivo JSON.
    await writeDB(db);
    // 6. Respondemos con éxito.
    res.status(201).json({ success: true, message: "Mensajes guardados." });
  } else {
    // Si algo falla, devolvemos un error 404 (No encontrado).
    res.status(404).json({ error: 'Estudiante no encontrado o mensajes no proporcionados' });
  }
});

/**
 * ENDPOINT 3: Actualizar el Perfil de Aprendizaje del Estudiante
 * PATCH /student/:studentId/profile
 */
router.patch('/student/:studentId/profile', async (req, res) => {
  // 1. Extraemos el ID del estudiante de la URL y los datos a actualizar del cuerpo de la petición.
  const { studentId } = req.params;
  const updates = req.body;
  // 2. Leemos la base de datos.
  const db = await readDB();

  // 3. Verificamos que el estudiante exista.
  if (db[studentId]) {
    // 4. Usamos Object.assign para fusionar los campos nuevos (updates) con el perfil existente.
    Object.assign(db[studentId], updates);
    // 5. Guardamos los cambios en el archivo JSON.
    await writeDB(db);
    // 6. Devolvemos el perfil completo y actualizado.
    res.json(db[studentId]);
  } else {
    // Si no se encuentra el estudiante, devolvemos un error 404.
    res.status(404).json({ error: 'Estudiante no encontrado' });
  }
});

/**
 * ENDPOINT 4: Obtener Contexto Relevante de un Documento (RAG)
 * POST /rag/context
 * NOTA: La lógica de RAG aún vive en el frontend. Este es un placeholder.
 */
router.post('/rag/context', async (req, res) => {
  // 1. Extraemos la pregunta del usuario del cuerpo de la petición.
  const { question } = req.body;

  // 2. Validamos que la pregunta no esté vacía.
  if (!question) {
    return res.status(400).json({ error: 'La pregunta es obligatoria.' });
  }

  // --- LÓGICA FUTURA ---
  // Aquí iría el código para:
  // 1. Tomar la 'question'.
  // 2. Convertirla en un embedding.
  // 3. Buscar en la base de datos vectorial (que debería vivir en el backend).
  // 4. Devolver los trozos de texto más relevantes.
  // --- FIN LÓGICA FUTURA ---

  // 3. Por ahora, como es un placeholder, devolvemos una respuesta simulada.
  res.json({ context: `Contexto simulado para la pregunta: "${question}"` });
});

module.exports = router; // Exportamos el router para que server.js pueda usarlo