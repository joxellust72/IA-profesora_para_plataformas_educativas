@echo off
echo =================================================
echo      Servidor de Voz Coqui TTS para DokiAI
echo =================================================

echo.
echo Instalando/verificando dependencias desde requirements.txt...
pip install -r requirements.txt

echo.
echo Iniciando servidor de TTS en http://localhost:50022
echo (La primera vez puede tardar en descargar el modelo de voz)
python tts_server.py
pause