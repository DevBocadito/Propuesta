// ======================================================================
// CONFIGURACIÓN PRINCIPAL
// ======================================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbze58f6g0spQGYMVonYKvbm-pQtJPFox4sXLashfwgJG_0L4AQV3N0Xrj5icdsX3BtICw/exec'; // <-- ¡IMPORTANTE!

// ======================================================================
// VARIABLES GLOBALES
// ======================================================================
var productoSeleccionado = null;
var productosEnVenta = [];
var listaDeProductosCompleta = [];
var configuracionDescuentos = [];
var descuentosPorCantidad = [];
var debounceTimer;
var isLimpiandoCampos = false;

// ======================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ======================================================================
document.addEventListener("DOMContentLoaded", function() {
  cargarDatosIniciales();
  
  // Asignación de todos los eventos
  document.getElementById('btn-agregar-producto').addEventListener('click', agregarProducto);
  document.getElementById('formVenta').addEventListener('submit', handleFormSubmit);
  document.getElementById('producto-input').addEventListener('input', onProductSelect);
  document.getElementById('tipoCliente').addEventListener('change', calcularDescuentos);
  document.getElementById('btn-cancelar-venta').addEventListener('click', cerrarModalConfirmacion);
  document.getElementById('btn-confirmar-venta').addEventListener('click', confirmarVenta);
  
  establecerFechaActual();
});

function cargarDatosIniciales() {
  const productoInput = document.getElementById("producto-input");
  const selectCliente = document.getElementById('tipoCliente');
  const opcionCargaCliente = document.getElementById('opcion-carga-cliente');

  fetch(`${API_URL}?action=obtenerDatosIniciales`)
    .then(response => {
      if (!response.ok) throw new Error('Error de red');
      return response.json();
    })
    .then(respuesta => {
      if (respuesta.estado === 'ok') {
        configuracionDescuentos = respuesta.descuentos;
        descuentosPorCantidad = respuesta.descuentosCantidad;
        listaDeProductosCompleta = respuesta.productos;

        const datalist = document.getElementById("lista-productos");
        datalist.innerHTML = '';
        respuesta.productos.forEach(p => { 
          datalist.innerHTML += `<option value="${p.nombre}"></option>`; 
        });
        
        const tiposCliente = respuesta.tiposCliente || [];
        opcionCargaCliente.textContent = 'Selecciona...';
        tiposCliente.forEach(tipo => {
          const option = document.createElement('option');
          option.value = tipo;
          option.textContent = tipo;
          selectCliente.appendChild(option);
        });
        selectCliente.disabled = false;
        productoInput.disabled = false;
        productoInput.placeholder = "Escribe para buscar un producto";
      }
    })
    .catch(error => {
      mostrarNotificacion('Error de conexión al cargar datos.', 'error');
    });
}

// ======================================================================
// LÓGICA DE MANEJO DE PRODUCTOS
// ======================================================================

function onProductSelect() {
  // Lógica de onProductSelect... (ya está completa en tu versión)
}

function agregarProducto() {
  if (!productoSeleccionado) {
    mostrarNotificacion("Debe seleccionar un producto válido.", "error");
    return;
  }
  const cantidad = parseInt(document.getElementById("cantidad").value, 10);
  if (!cantidad || cantidad <= 0) {
    mostrarNotificacion("La cantidad debe ser mayor a 0.", "error");
    return;
  }
  
  const nuevoProducto = {
    nombre: productoSeleccionado.nombre,
    cantidad: cantidad,
    precioOriginal: productoSeleccionado.precio,
    subtotal: cantidad * productoSeleccionado.precio,
  };

  productosEnVenta.push(nuevoProducto);
  renderizarTablaProductos();
  limpiarCamposDeProducto();
  mostrarNotificacion("Producto añadido.", "success");
}

function limpiarCamposDeProducto() {
  document.getElementById('producto-input').value = "";
  document.getElementById('precioUnitario').value = "";
  document.getElementById('cantidad').value = "1";
  document.getElementById('stock').value = "";
  productoSeleccionado = null;
  document.getElementById('producto-input').focus();
}

function renderizarTablaProductos() {
  const tbody = document.querySelector("#tabla-productos tbody");
  tbody.innerHTML = "";
  productosEnVenta.forEach((producto, index) => {
    const fila = tbody.insertRow();
    fila.innerHTML = `
      <td data-label="Producto">${producto.nombre}</td>
      <td data-label="Cant.">${producto.cantidad}</td>
      <td data-label="Subtotal">${formatearNumero(producto.subtotal)}</td>
      <td data-label="Acción"><button type="button" class="btn-eliminar" onclick="removerProducto(${index})">X</button></td>
    `;
  });
  calcularDescuentos();
}

function removerProducto(indice) {
  productosEnVenta.splice(indice, 1);
  renderizarTablaProductos();
}

// ======================================================================
// LÓGICA DE CÁLCULOS Y FINALIZACIÓN DE VENTA
// ======================================================================

function calcularDescuentos() {
  // Lógica de calcularDescuentos... (ya está completa en tu versión)
}

function handleFormSubmit(event) {
  event.preventDefault();
  if (productosEnVenta.length === 0) {
    mostrarNotificacion("Debe añadir al menos un producto.", "error");
    return;
  }
  mostrarModalConfirmacion();
}

function mostrarModalConfirmacion() {
  // Lógica de mostrarModalConfirmacion... (ya está completa en tu versión)
}

function cerrarModalConfirmacion() {
  document.getElementById('modal-confirmacion').style.display = 'none';
}

function confirmarVenta() {
  cerrarModalConfirmacion();
  
  const datosVenta = {
    detallesVenta: {
      fecha: document.getElementById("fecha").value,
      vendedor: document.getElementById("vendedor").value,
      tipoCliente: document.getElementById("tipoCliente").value,
      medioPago: document.getElementById("medioPago").value,
      observaciones: document.getElementById("observaciones").value,
    },
    productosVendidos: productosEnVenta
  };

  const boton = document.getElementById("btn-guardar-venta");
  boton.disabled = true;
  boton.textContent = "Guardando...";

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'guardarVenta',
      datosVenta: datosVenta
    })
  })
  .then(response => response.json())
  .then(respuesta => {
     if (respuesta.status === 'ok') {
       mostrarNotificacion(`Venta de prueba guardada con ID: ${respuesta.idVenta}`, 'success');
       document.getElementById("formVenta").reset();
       productosEnVenta = [];
       renderizarTablaProductos();
       establecerFechaActual();
     } else {
       mostrarNotificacion(respuesta.mensaje, 'error');
     }
  })
  .catch(error => {
    mostrarNotificacion('Error de conexión al guardar: ' + error.message, 'error');
  })
  .finally(() => {
    boton.disabled = false;
    boton.textContent = "Guardar Venta";
  });
}

function establecerFechaActual() {
  const fechaInput = document.getElementById("fecha");
  if (fechaInput) {
    const hoy = new Date();
    fechaInput.value = hoy.toISOString().split('T')[0];
  }
}