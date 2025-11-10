/**
 * Este módulo actúa como un cliente para la API del backend, gestionando
 * la carga y actualización de los perfiles de estudiante.
 */

// ID del estudiante para la demo.
const DEMO_STUDENT_ID = "student-demo-01";
const API_BASE_URL = "http://localhost:3000/api";

let currentProfile = null;

/**
 * Carga el perfil del estudiante desde el backend.
 * @returns {object} El perfil del estudiante.
 */
export async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/student/${DEMO_STUDENT_ID}`);
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.statusText}`);
    }
    currentProfile = await response.json();
    return currentProfile;
  } catch (error) {
    console.error("No se pudo cargar el perfil desde el backend:", error);
    // En caso de que el backend no funcione, devolvemos un perfil local para que la app no se rompa.
    return { id: DEMO_STUDENT_ID, name: "Estudiante (Offline)", chatHistory: [] };
  }
}

/**
 * Envía mensajes al backend para que los guarde en el historial.
 * @param {Array<object>} messages - Un array de objetos de mensaje ({role, content}).
 */
export async function addMessagesToHistory(messages) {
  try {
    await fetch(`${API_BASE_URL}/student/${DEMO_STUDENT_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });
  } catch (error) {
    console.error("No se pudieron guardar los mensajes en el backend:", error);
  }
}

/**
 * Envía actualizaciones del perfil al backend.
 * @param {object} updates - Un objeto con los campos a actualizar. Ej: { learningStyle: 'visual' }
 */
export async function updateProfile(updates) {
  try {
    const response = await fetch(`${API_BASE_URL}/student/${DEMO_STUDENT_ID}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.statusText}`);
    }
    const updatedProfile = await response.json();
    console.log("Perfil actualizado desde el backend:", updatedProfile);
    currentProfile = updatedProfile; // Sincronizamos el perfil local
  } catch (error) {
    console.error("No se pudo actualizar el perfil en el backend:", error);
  }
}