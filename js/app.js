// URL de tu API GAS
const API_URL = "https://script.google.com/macros/s/XXXXX/exec"; // <-- reemplaza con tu URL

// Cargar datos iniciales
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(API_URL + "?action=obtenerDatosIniciales");
    const data = await res.json();

    if (data.estado === "ok") {
      llenarSelect("producto", data.productos.map(p => p.nombre));
      llenarSelect("tipoCliente", data.tiposCliente);
    } else {
      console.error("Error:", data.mensaje);
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
      data.status === "ok" ? "Venta guardada con ID: " + data.idVenta : "Error: " + data.message;
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