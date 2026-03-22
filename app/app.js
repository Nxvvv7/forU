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
// 🔥 METAS
//////////////////////////////////////////////////

async function guardarMeta(texto) {
  if (!texto) return;

  await addDoc(collection(db, "metas"), {
    contenido: texto,
    fecha: new Date()
  });

  cargarMetas();
}

async function cargarMetas() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "metas"));

  querySnapshot.forEach((docu) => {
    const li = document.createElement("li");

    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    const texto = document.createElement("span");
    texto.textContent = docu.data().contenido;

    const boton = document.createElement("span");
    boton.textContent = "❌";
    boton.style.cursor = "pointer";

    boton.onclick = () => borrarMeta(docu.id);

    li.appendChild(texto);
    li.appendChild(boton);

    lista.appendChild(li);
  });
}

async function borrarMeta(id) {
  await deleteDoc(doc(db, "metas", id));
  cargarMetas();
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

// Hacerlas disponibles globalmente
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
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
escucharChat();
cargarMetas();
cargarFotos();