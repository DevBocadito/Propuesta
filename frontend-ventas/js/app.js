// URL de tu API GAS
const API_URL = "https://script.google.com/macros/s/AKfycbz_SDClUa86tLm1F_fOSotSdYd1X9bdQy5Jn5qbDgt69EArQ7X3NCYgGONBjbI1i4SVPA/exec"; // <-- pon tu URL

// Control de vistas
function mostrarVista(nombre) {
  document.querySelectorAll(".vista").forEach(v => v.classList.remove("activa"));
  document.getElementById("vista-" + nombre).classList.add("activa");

  // Cerrar menú al seleccionar en móvil
  document.getElementById("sidebar").classList.remove("abierto");
}

// Sidebar toggle
document.getElementById("menu-toggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("abierto");
});

// Cargar datos iniciales
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(API_URL + "?action=obtenerDatosIniciales");
    const data = await res.json();

    if (data.estado === "ok") {
      llenarSelect("producto", data.productos.map(p => p.nombre));
      llenarSelect("tipoCliente", data.tiposCliente);
    }
  } catch (err) {
    console.error("Error API:", err);
  }
});

// Guardar venta
document.getElementById("formVenta").addEventListener("submit", async (e) => {
  e.preventDefault();

  const venta = {
    detallesVenta: {
      fecha: new Date().toISOString().slice(0,10),
      vendedor: document.getElementById("vendedor").value,
      tipoCliente: document.getElementById("tipoCliente").value,
      medioPago: "Efectivo",
      observaciones: ""
    },
    productosVendidos: [{
      nombre: document.getElementById("producto").value,
      cantidad: parseInt(document.getElementById("cantidad").value, 10)
    }]
  };

  try {
    const res = await fetch(API_URL + "?action=guardarVenta", {
      method: "POST",
      body: JSON.stringify(venta)
    });
    const data = await res.json();
    document.getElementById("respuesta").innerText =
      data.status === "ok"
        ? "✅ Venta guardada con ID: " + data.idVenta
        : "❌ Error: " + data.message;
  } catch (err) {
    console.error("Error al guardar venta:", err);
  }
});

// Helpers
function llenarSelect(id, opciones) {
  const sel = document.getElementById(id);
  sel.innerHTML = "";
  opciones.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    sel.appendChild(o);
  });
}
