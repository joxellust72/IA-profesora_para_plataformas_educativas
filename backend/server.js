const express = require('express');
const cors = require('cors');

// Importamos el nuevo archivo de rutas
const apiRoutes = require('./apiRoutes');

const app = express();
const PORT = 3000;

// --- Middlewares ---
app.use(cors()); // Permite que el frontend (en otro puerto) se comunique con este servidor
app.use(express.json()); // Permite al servidor entender JSON en las peticiones (para POST y PATCH)

// --- Cargar Rutas de la API ---
// Le decimos a Express que todas las rutas definidas en apiRoutes
// deben empezar con el prefijo '/api'.
// Ej: router.get('/student/:studentId') se convierte en GET /api/student/:studentId
app.use('/api', apiRoutes);

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor de backend real escuchando en http://localhost:${PORT}`);
  console.log('Este servidor gestiona los perfiles de los estudiantes.');
});
