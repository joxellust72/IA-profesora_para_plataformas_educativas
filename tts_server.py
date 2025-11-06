from flask import Flask, request, send_file
from piper.voice import PiperVoice
import io
from pathlib import Path

# --- Configuración de Piper ---
# Apuntamos directamente a los archivos que descargamos manualmente.
MODEL_PATH = "./piper_models/es_ES-sharvard-medium.onnx"
CONFIG_PATH = "./piper_models/es_ES-sharvard-medium.onnx.json"

# Carga la voz desde los archivos locales
print("Cargando modelo de voz...")
voice = PiperVoice.load(MODEL_PATH, CONFIG_PATH)
# -----------------------------

print("¡Servidor de voz con Piper-TTS listo!")

app = Flask(__name__)

@app.route('/tts', methods=['GET'])
def text_to_speech():
    text = request.args.get('text')
    if not text:
        return "Error: El parámetro 'text' es requerido.", 400

    print(f"Sintetizando texto: '{text}'")
    try:
        wav_io = io.BytesIO()
        voice.synthesize(text, wav_io)
        wav_io.seek(0)
        return send_file(wav_io, mimetype='audio/wav')
    except Exception as e:
        print(f"Error durante la síntesis: {e}")
        return "Error interno durante la síntesis de voz.", 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=50022)
