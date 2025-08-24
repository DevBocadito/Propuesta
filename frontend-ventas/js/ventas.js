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
    const data = await apiPost("guardarVenta", venta);
    document.getElementById("respuesta").innerText =
      data.status === "ok"
        ? "✅ Venta guardada con ID: " + data.idVenta
        : "❌ Error: " + data.message;
  } catch (err) {
    console.error("Error al guardar venta:", err);
    document.getElementById("respuesta").innerText = "⚠️ Error en conexión";
  }
});