export const appendMsg = (chatBox, role, content) => {
  if (!chatBox) return;
  const div = document.createElement("div");
  div.className = `msg ${role === "Bot" ? "bot" : "user"}`;

  const roleSpan = document.createElement("span");
  roleSpan.textContent = `${role === "Bot" ? "Profe Ana" : "Tú"}: `;
  roleSpan.className = "font-bold";

  const contentSpan = document.createElement("span");
  contentSpan.textContent = content || "";

  div.appendChild(roleSpan);
  div.appendChild(contentSpan);

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
};

export const typeWriterEffect = (element, text, callback) => {
  if (!element) return;
  let i = 0;
  const speed = 50;
  function type() {
    if (i < text.length) {
      element.innerHTML = text.substring(0, i + 1) + '<span class="animate-ping">|</span>';
      i++;
      setTimeout(type, speed);
    } else {
      element.innerHTML = text;
      if (callback) callback();
    }
  }
  type();
};

export const obtenerEmocion = (mensaje) => {
  if (!mensaje || mensaje.length < 4) return "cal";
  return mensaje.slice(1, 4);
};

export const setImagen = (imagenElement, emocion) => {
  if (!imagenElement) return;
  let imagen = "img/normal.png";
  switch (emocion) {
    case "ale": imagen = "img/ale.png"; break;
    case "mot": imagen = "img/ale.png"; break;
    case "cal": imagen = "img/normal.png"; break;
    case "ser": imagen = "img/normal.png"; break;
    case "dud": imagen = "img/tri.png"; break;
    case "pens": imagen = "img/pensando.png"; break;
    default: imagen = "img/normal.png";
  }
  imagenElement.src = imagen;
};