class VentasModule {
  constructor() {
    this.form = document.getElementById("ventasForm");
    this.tabla = document.getElementById("tablaVentas").querySelector("tbody");
    this.ventas = [];

    this.init();
  }

  init() {
    if (this.form) {
      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.registrarVenta();
      });
    }
  }

  registrarVenta() {
    const datos = {
      fecha: this.form.fecha.value,
      vendedor: this.form.vendedor.value,
      producto: this.form.producto.value,
      cantidad: this.form.cantidad.value
    };

    // Guardamos en memoria local (luego será API)
    this.ventas.push(datos);

    // Refrescamos tabla
    this.renderTabla();
    this.form.reset();
  }

  renderTabla() {
    this.tabla.innerHTML = "";
    this.ventas.forEach((venta) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${venta.fecha}</td>
        <td>${venta.vendedor}</td>
        <td>${venta.producto}</td>
        <td>${venta.cantidad}</td>
      `;
      this.tabla.appendChild(fila);
    });
  }
}
