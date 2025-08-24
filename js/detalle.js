const API_URL = "https://script.google.com/macros/s/AKfycbz_SDClUa86tLm1F_fOSotSdYd1X9bdQy5Jn5qbDgt69EArQ7X3NCYgGONBjbI1i4SVPA/exec"; // <-- reemplaza con tu URL

async function cargarVenta() {
  const id = document.getElementById("idVenta").value.trim();
  if (!id) return alert("Ingresa un ID de venta");

  try {
    const res = await fetch(API_URL + "?action=obtenerVentaPorId&id=" + encodeURIComponent(id));
    const data = await res.json();
    document.getElementById("detalle").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("Error API:", err);
  }
}