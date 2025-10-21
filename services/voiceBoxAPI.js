async function reproducirVoz(textoIngresado) {
    // Limpiamos la etiqueta de emoción para que no se lea en voz alta.
    const textoLimpio = textoIngresado.slice(5);

    // Llamamos a nuestro nuevo servidor Coqui TTS en el puerto 50022.
    const response = await fetch(`http://localhost:50022/tts?text=${encodeURIComponent(textoLimpio)}`);
    if (!response.ok) {
        throw new Error(`Error en el servidor de voz: ${response.statusText}`);
    }
    const audioBlob = await response.blob();
    const audioURL = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioURL);

    return new Promise((resolve) => {
        // Resolvemos la promesa cuando el audio termine de reproducirse.
        audio.onended = resolve;
        audio.play();
    });
}

export { reproducirVoz };