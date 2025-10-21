from flask import Flask, request, send_file
from TTS.api import TTS
import torch
import io
import os

# --- Configuración ---
# Usar CUDA si está disponible para acelerar la generación, si no, usará la CPU.
device = "cuda" if torch.cuda.is_available() else "cpu"

# Modelo de voz en español. Este es uno de los mejores modelos de Coqui para español.
model_name = "tts_models/es/mai/tacotron2-DDC"

# --- Inicialización del Servidor y Modelo ---
print(f"Iniciando servidor TTS en el dispositivo: {device}")

# Cargar el modelo de Coqui TTS en la memoria. Esto puede tardar un poco la primera vez.
print(f"Cargando modelo: {model_name}...")
tts = TTS(model_name).to(device)
print("¡Modelo cargado y listo!")

app = Flask(__name__)

# --- Endpoint de la API ---
@app.route('/tts', methods=['GET'])
def text_to_speech():
    # Obtener el texto del parámetro 'text' en la URL
    text = request.args.get('text')
    if not text:
        return "Error: El parámetro 'text' es requerido.", 400

    print(f"Sintetizando texto: '{text}'")
    try:
        # Generar el audio en un archivo en memoria
        wav_io = io.BytesIO()
        tts.tts_to_file(text=text, file_path=wav_io)
        wav_io.seek(0) # Regresar al inicio del archivo para poder enviarlo
        return send_file(wav_io, mimetype='audio/wav')
    except Exception as e:
        print(f"Error durante la síntesis: {e}")
        return "Error interno durante la síntesis de voz.", 500

if __name__ == '__main__':
    # Usamos el puerto 50022 para no chocar con el puerto de VoiceVox (50021)
    app.run(host='0.0.0.0', port=50022)