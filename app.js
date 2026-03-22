import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onSnapshot, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { updateDoc } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDWZTHAjvielvOlRljQ8ZxxDkU_IF0s3kA",
  authDomain: "genesis-acc68.firebaseapp.com",
  projectId: "genesis-acc68",
  storageBucket: "genesis-acc68.firebasestorage.app",
  messagingSenderId: "927892532926",
  appId: "1:927892532926:web:d4ebdf8547e454b4b0f8ef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

//////////////////////////////////////////////////
// 🔥 METAS (Actualizada con Posicionamiento de X)
//////////////////////////////////////////////////

// ... (las funciones guardarMeta y alternarMeta se mantienen igual) ...

async function cargarMetas() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  // Ordenamos por fecha para que las nuevas aparezcan arriba o abajo
  const q = query(collection(db, "metas"), orderBy("fecha", "desc"));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((docu) => {
    const data = docu.data();
    const li = document.createElement("li");
    // li.className = "meta-item"; // Si quieres añadir una clase general

    // Contenedor para el texto y el emoji (mismo que antes)
    const contenidoCuerpo = document.createElement("div");
    contenidoCuerpo.style.display = "flex";
    contenidoCuerpo.style.alignItems = "center";
    contenidoCuerpo.style.gap = "10px";
    contenidoCuerpo.style.cursor = "pointer"; // Cursor de mano sobre el texto
    
    // Emoji dinámico: Corazón lleno si está lista, vacío si falta
    const emoji = document.createElement("span");
    emoji.textContent = data.completada ? "❤️" : "🤍";
    
    const texto = document.createElement("span");
    texto.className = "meta-texto"; // <--- AÑADIR CLASE
    texto.textContent = data.contenido;

    // Aplicar tachado si está completada (mismo que antes)
    if (data.completada) {
      texto.style.textDecoration = "line-through";
      texto.style.opacity = "0.6";
    }

    // Al hacer clic en el texto o emoji, se tacha/destacha (mismo que antes)
    contenidoCuerpo.onclick = () => alternarMeta(docu.id, data.completada);

    // NUEVO: Botón de borrar con clase y posicionamiento
    const botonBorrar = document.createElement("span");
    botonBorrar.textContent = "❌";
    botonBorrar.className = "borrar-meta"; // <--- AÑADIR CLASE
    botonBorrar.onclick = (e) => {
      e.stopPropagation(); // Evita que se tacha al intentar borrar
      borrarMeta(docu.id);
    };

    contenidoCuerpo.appendChild(emoji);
    contenidoCuerpo.appendChild(texto);
    li.appendChild(contenidoCuerpo);
    li.appendChild(botonBorrar); // La X ahora se posiciona absolutamente

    lista.appendChild(li);
  });
}

//////////////////////////////////////////////////
// 🔥 FOTOS (Cloudinary)
//////////////////////////////////////////////////

async function subirFoto() {
  const input = document.getElementById("fotoInput");
  const file = input.files[0];
  const texto = document.getElementById("textoFoto").value;

  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "mi_present"); // ✅ bien escrito

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dwnn2bgpf/image/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json(); // ✅ primero esto

    if (!data.secure_url) {
      console.error("Error Cloudinary:", data);
      return;
    }

    // 🔥 guardar UNA sola vez
    await addDoc(collection(db, "fotos"), {
      url: data.secure_url,
      texto: texto,
      fecha: new Date()
    });

    input.value = "";
    document.getElementById("textoFoto").value = "";

    cargarFotos();

  } catch (error) {
    console.error("Error:", error);
  }
}

async function cargarFotos() {
  const galeria = document.getElementById("galeria");
  galeria.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "fotos"));

  querySnapshot.forEach((docu) => {
    const data = docu.data();

    const contenedor = document.createElement("div");
    contenedor.className = "foto-card";

    const img = document.createElement("img");
    img.src = data.url;
    img.style.cursor = "zoom-in"; // Cambia el cursor para indicar que se puede ampliar
    img.onclick = () => abrirModal(data.url, data.texto); // <--- AÑADIR ESTO

    const texto = document.createElement("div");
    texto.className = "foto-texto";
    texto.textContent = data.texto || "";

    const borrar = document.createElement("span");
    borrar.textContent = "❌";
    borrar.className = "borrar-foto";
    borrar.onclick = () => borrarFoto(docu.id);

    contenedor.appendChild(img);
    contenedor.appendChild(borrar);
    contenedor.appendChild(texto);

    galeria.appendChild(contenedor);
  });
}

async function borrarFoto(id) {
  await deleteDoc(doc(db, "fotos", id));
  cargarFotos();
}

async function enviarMensaje() {
  const input = document.getElementById("mensajeInput");
  const texto = input.value;

  if (!texto || !usuario) return;

  await addDoc(collection(db, "chat"), {
  texto: texto,
  usuario: usuario,
  fecha: serverTimestamp()
 });

  input.value = "";
}

function escucharChat() {
  const contenedor = document.getElementById("mensajes");

  const q = query(collection(db, "chat"), orderBy("fecha"));

  onSnapshot(q, (snapshot) => {
    contenedor.innerHTML = "";

    snapshot.forEach((docu) => {
      const data = docu.data();

      const msg = document.createElement("div");

      const esMio = data.usuario === usuario;

      msg.style.display = "flex";
      msg.style.flexDirection = "column";
      msg.style.alignItems = esMio ? "flex-end" : "flex-start";

      const burbuja = document.createElement("div");
      burbuja.textContent = data.texto;

      burbuja.style.background = esMio ? "#22c55e" : "#334155";
      burbuja.style.color = "white";
      burbuja.style.padding = "8px 12px";
      burbuja.style.borderRadius = "15px";
      burbuja.style.margin = "5px";
      burbuja.style.maxWidth = "70%";

      const info = document.createElement("span");
      info.textContent = data.usuario || "Anon";

      info.style.fontSize = "10px";
      info.style.opacity = "0.7";

      msg.appendChild(info);
      msg.appendChild(burbuja);

      contenedor.appendChild(msg);
    });

    contenedor.scrollTop = contenedor.scrollHeight;
  });
}

let usuario = localStorage.getItem("usuario") || "";

const nombreInput = document.getElementById("nombreInput");

if (usuario) {
  nombreInput.value = usuario;
}

nombreInput.addEventListener("change", () => {
  usuario = nombreInput.value;
  localStorage.setItem("usuario", usuario);
});

let contadorClicks = 0;

function sumarClick() {
  contadorClicks++;

  document.getElementById("botonSorpresa").textContent =
    `🎁 ${contadorClicks} clicks`;

  verificarSorpresa();
}

async function crearSorpresa() {
  const mensaje = document.getElementById("mensajeCrear").value;
  const clicks = parseInt(document.getElementById("clicksNecesarios").value);
  const file = document.getElementById("archivoSorpresa").files[0];

  if (!mensaje || !clicks) return;

  let url = "";

  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "mi_present");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dwnn2bgpf/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await res.json();
    url = data.secure_url;
  }

  await addDoc(collection(db, "sorpresas"), {
  mensaje: mensaje,
  clicks: clicks,
  url: url || "",
  usada: false, // 🔥 importante
  fecha: new Date()
  });

  alert("Sorpresa guardada 🎁");
}

async function verificarSorpresa() {
  const contenedor = document.getElementById("resultadoSorpresa");

  const querySnapshot = await getDocs(collection(db, "sorpresas"));

  let sorpresaEncontrada = null;
  let idDoc = null;

  querySnapshot.forEach((docu) => {
    const data = docu.data();

    // 🔥 solo busca una que NO esté usada
    if (!data.usada && contadorClicks >= data.clicks && !sorpresaEncontrada) {
      sorpresaEncontrada = data;
      idDoc = docu.id;
    }
  });

  if (sorpresaEncontrada) {

    let extra = "";

    if (sorpresaEncontrada.url) {
      if (sorpresaEncontrada.url.includes("image")) {
        extra = `<img src="${sorpresaEncontrada.url}" style="width:100%; border-radius:10px;">`;
      } else if (sorpresaEncontrada.url.includes("video")) {
        extra = `<video controls src="${sorpresaEncontrada.url}" style="width:100%;"></video>`;
      } else {
        extra = `<audio controls src="${sorpresaEncontrada.url}"></audio>`;
      }
    }

    contenedor.innerHTML = `
      <div style="margin-top:10px; padding:10px; background:#22c55e; border-radius:10px;">
        <h3>🎉 Sorpresa desbloqueada</h3>
        <p>${sorpresaEncontrada.mensaje}</p>
        ${extra}
      </div>
    `;

    // 🔥 marcar como usada
    await updateDoc(doc(db, "sorpresas", idDoc), {
      usada: true
    });

    // 🔥 reiniciar clicks
    contadorClicks = 0;
    document.getElementById("botonSorpresa").textContent = "🎁 0 clicks";
  }
}

function abrirModal(url, texto) {
  const modal = document.getElementById("fotoModal");
  document.getElementById("imgModal").src = url;
  document.getElementById("textoModal").textContent = texto || "";
  modal.style.display = "flex";
}

function cerrarModal() {
  document.getElementById("fotoModal").style.display = "none";
}

//////////////////////////////////////////////////
// 🔥 GUSTOS (Multimedia + Texto + Fecha)
//////////////////////////////////////////////////

async function subirGusto() {
  const input = document.getElementById("gustoInput");
  const file = input.files[0];
  const texto = document.getElementById("textoGusto").value;

  if (!file && !texto) return; // Al menos debe haber texto o archivo

  let url = "";
  let tipo = "";

  if (file) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "mi_present");

      // Cloudinary detecta automáticamente el tipo si usamos /auto/upload
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dwnn2bgpf/auto/upload",
        { method: "POST", body: formData }
      );

      const data = await response.json();
      url = data.secure_url;
      tipo = data.resource_type; // 'image', 'video' o 'raw' (para audio)
    } catch (error) {
      console.error("Error subiendo a Cloudinary:", error);
    }
  }

  // Guardar en Firebase
  await addDoc(collection(db, "gustos"), {
    url: url,
    texto: texto,
    tipo: tipo,
    fecha: new Date()// Guarda la fecha legible
  });

  // Limpiar y recargar
  input.value = "";
  document.getElementById("textoGusto").value = "";
  cargarGustos();
}

async function cargarGustos() {
  const contenedor = document.getElementById("listaGustos");
  contenedor.innerHTML = "";

  // 1. Creamos la consulta ordenada por el campo "fecha"
  // Use "desc" si quieres lo más nuevo arriba, o quítalo para lo más viejo arriba
  const q = query(collection(db, "gustos"), orderBy("fecha", "desc"));

  // 2. Usamos la consulta 'q' en lugar de la colección directa
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((docu) => {
    const data = docu.data();
    const card = document.createElement("div");
    
    card.style.background = "#334155";
    card.style.padding = "15px";
    card.style.borderRadius = "15px";
    card.style.position = "relative";
    card.style.marginBottom = "10px";

    let mediaHTML = "";
    if (data.url) {
      if (data.tipo === "image") {
        mediaHTML = `<img src="${data.url}" style="width:100%; border-radius:10px; cursor:pointer;" onclick="abrirModal('${data.url}', '${data.texto}')">`;
      } else if (data.tipo === "video") {
        mediaHTML = `<video src="${data.url}" controls style="width:100%; border-radius:10px;"></video>`;
      } else if (data.tipo === "raw" || data.url.includes("mp3") || data.url.includes("wav")) {
        mediaHTML = `<audio src="${data.url}" controls style="width:100%;"></audio>`;
      }
    }

    card.innerHTML = `
      <span style="position:absolute; top:10px; right:15px; cursor:pointer; font-weight:bold;" onclick="borrarGusto('${docu.id}')">❌</span>
      ${mediaHTML}
      <p style="margin: 10px 0 5px 0; color: white;">${data.texto}</p>
      <small style="opacity:0.5; font-size:10px;">${data.fecha}</small>
    `;

    contenedor.appendChild(card);
  });
}

async function borrarGusto(id) {
  if(confirm("¿Borrar este gusto?")) {
    await deleteDoc(doc(db, "gustos", id));
    cargarGustos();
  }
}
//////////////////////////////////////////////////
// 🔥 GLOBAL
//////////////////////////////////////////////////

window.guardarMeta = guardarMeta;
window.subirFoto = subirFoto; // 🔥 IMPORTANTE
window.enviarMensaje = enviarMensaje;
window.crearSorpresa = crearSorpresa;
window.sumarClick = sumarClick;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.subirGusto = subirGusto;
window.borrarGusto = borrarGusto;
escucharChat();
cargarMetas();
cargarFotos();
cargarGustos();
