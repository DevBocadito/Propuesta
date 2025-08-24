// ======================================================================
// CONFIGURACIÓN PRINCIPAL
// ======================================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbz_SDClUa86tLm1F_fOSotSdYd1X9bdQy5Jn5qbDgt69EArQ7X3NCYgGONBjbI1i4SVPA/exec'; // <-- ¡IMPORTANTE! Pega tu URL aquí.

// ======================================================================
// VARIABLES GLOBALES DE ESTADO
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
  // Llama a la función para cargar todos los datos iniciales desde la API.
  cargarDatosIniciales();
  
  // Asigna los listeners a los botones y eventos del formulario.
  document.getElementById('formVenta').addEventListener('submit', handleFormSubmit);
  document.getElementById('producto-input').addEventListener('input', onProductSelect);
  document.getElementById('btn-agregar-producto').addEventListener('click', agregarProducto);
  document.getElementById('tipoCliente').addEventListener('change', calcularDescuentos);
  document.getElementById('btn-cancelar-venta').addEventListener('click', cerrarModalConfirmacion);
  document.getElementById('btn-confirmar-venta').addEventListener('click', confirmarVenta);

  establecerFechaActual();
});

/**
 * Carga los datos esenciales (productos, descuentos, etc.) desde la API al iniciar.
 */
function cargarDatosIniciales() {
  const productoInput = document.getElementById("producto-input");
  const selectCliente = document.getElementById('tipoCliente');
  const opcionCargaCliente = document.getElementById('opcion-carga-cliente');

  productoInput.disabled = true;
  productoInput.placeholder = "Cargando datos...";

  // --- REEMPLAZO DE google.script.run POR fetch ---
  fetch(`${API_URL}?action=obtenerDatosIniciales`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Error de red: ' + response.statusText);
      }
      return response.json();
    })
    .then(respuesta => {
      // Misma lógica que tenías en el withSuccessHandler
      if (respuesta.estado === 'ok') {
        configuracionDescuentos = respuesta.descuentos;
        descuentosPorCantidad = respuesta.descuentosCantidad;
        listaDeProductosCompleta = respuesta.productos;

        const datalist = document.getElementById("lista-productos");
        if (datalist) {
          datalist.innerHTML = '';
          respuesta.productos.forEach(p => { 
            datalist.innerHTML += `<option value="${p.nombre}"></option>`; 
          });
        }
        
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

      } else {
        mostrarNotificacion(respuesta.mensaje || 'Error al cargar datos.', 'error');
        productoInput.placeholder = "Error al cargar datos";
        opcionCargaCliente.textContent = 'Error al cargar';
      }
    })
    .catch(error => {
      // Misma lógica que tenías en el withFailureHandler
      mostrarNotificacion('Error de conexión: ' + error.message, 'error');
      productoInput.placeholder = "Error de conexión";
      opcionCargaCliente.textContent = 'Error de conexión';
    });
}

// ======================================================================
// LÓGICA DE MANEJO DE PRODUCTOS
// ======================================================================

/**
 * Se ejecuta cuando el usuario escribe en el campo de producto para buscar detalles.
 */
function onProductSelect() {
  if (isLimpiandoCampos) return;
  
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const input = document.getElementById('producto-input');
    const nombreLimpio = input.value;
    const stockField = document.getElementById('stock');
    const precioField = document.getElementById("precioUnitario");

    // Verifica si el producto escrito existe en la lista cargada
    const productoValido = listaDeProductosCompleta.some(p => p.nombre === nombreLimpio);

    if (productoValido) {
      // --- REEMPLAZO DE google.script.run POR fetch ---
      fetch(`${API_URL}?action=obtenerDatosProducto&nombre=${encodeURIComponent(nombreLimpio)}`)
        .then(response => response.json())
        .then(datos => {
          if (datos) {
            precioField.value = formatearNumero(datos.precio);
            
            if (datos.disponibilidad === 'Disponible') {
              stockField.value = 'DISPONIBLE';
              stockField.style.backgroundColor = '#d4edda'; // Verde
            } else {
              stockField.value = 'AGOTADO';
              stockField.style.backgroundColor = '#f8d7da'; // Rojo
            }

            productoSeleccionado = {
              nombre: nombreLimpio,
              precio: datos.precio,
              disponibilidad: datos.disponibilidad
            };
          }
        })
        .catch(error => console.error("Error al obtener datos del producto:", error));
    } else {
      precioField.value = "";
      stockField.value = "";
      stockField.style.backgroundColor = '#e9ecef';
      productoSeleccionado = null;
    }
  }, 400); // Debounce para no hacer llamadas a la API en cada tecla
}

/**
 * Añade el producto seleccionado a la tabla de la venta actual.
 */
function agregarProducto() {
  // Esta función no necesita cambios, ya que su lógica es interna del frontend.
  if (!productoSeleccionado) {
    mostrarNotificacion("Debe seleccionar un producto válido.", "error");
    return;
  }
  if (productoSeleccionado.disponibilidad === 'Agotado') {
    mostrarNotificacion("Este producto está agotado y no se puede añadir.", "error");
    return;
  }

  const cantidad = parseInt(document.getElementById("cantidad").value, 10);
  if (!cantidad || cantidad <= 0) {
    mostrarNotificacion("La cantidad debe ser mayor a 0.", "error");
    return;
  }

  // Lógica de descuentos por cantidad (ya la tienes)
  // ...
  
  const nuevoProducto = {
    nombre: productoSeleccionado.nombre,
    cantidad: cantidad,
    precioOriginal: productoSeleccionado.precio,
    subtotal: cantidad * productoSeleccionado.precio, // Modificar si hay descuentos por cantidad
    // ... otros campos
  };

  productosEnVenta.push(nuevoProducto);
  renderizarTablaProductos();
  limpiarCamposDeProducto();
  mostrarNotificacion("Producto añadido.", "success");
}

// ======================================================================
// LÓGICA DE FINALIZACIÓN DE VENTA
// ======================================================================

/**
 * Previene el envío del formulario y muestra el modal de confirmación.
 * @param {Event} event
 */
function handleFormSubmit(event) {
  event.preventDefault();
  if (productosEnVenta.length === 0) {
    mostrarNotificacion("Debe añadir al menos un producto.", "error");
    return;
  }
  mostrarModalConfirmacion();
}

/**
 * Envía los datos de la venta a la API para ser guardados.
 */
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

  // --- REEMPLAZO DE google.script.run POR fetch (con método POST) ---
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'guardarVenta',
      datosVenta: datosVenta
    }),
    mode: 'no-cors' // Google Scripts a veces requiere esto para POST anónimos
  })
  .then(response => {
     // En 'no-cors' la respuesta es opaca, no podemos leerla.
     // Asumimos éxito y dejamos que la hoja de cálculo se actualice.
     // La redirección no es posible aquí, por lo que mostramos un mensaje para recargar.
     
     mostrarNotificacion('Venta enviada para ser guardada. Puede registrar una nueva venta.', 'success');
     document.getElementById("formVenta").reset();
     productosEnVenta = [];
     renderizarTablaProductos();
     establecerFechaActual();
     limpiarCamposDeProducto();

     // En un escenario ideal sin las limitaciones de 'no-cors', haríamos esto:
     // return response.json();
  })
  /*
  .then(respuesta => {
     // Este bloque solo funcionaría si no se usa 'no-cors'.
     if (respuesta.status === 'ok') {
       // La redirección ideal:
       // window.location.href = `detalle.html?id=${respuesta.idVenta}`;
     } else {
       mostrarNotificacion(respuesta.message, 'error');
     }
  })
  */
  .catch(error => {
    mostrarNotificacion('Error de conexión al guardar: ' + error.message, 'error');
  })
  .finally(() => {
    boton.disabled = false;
    boton.textContent = "Guardar Venta";
  });
}

// ======================================================================
// FUNCIONES AUXILIARES (sin cambios)
// ======================================================================
function establecerFechaActual() { /*...*/ }
function limpiarCamposDeProducto() { /*...*/ }
function renderizarTablaProductos() { /*...*/ }
function calcularDescuentos() { /*...*/ }
function mostrarModalConfirmacion() { /*...*/ }
function cerrarModalConfirmacion() { /*...*/ }
// (Pega aquí el resto de tus funciones auxiliares que no hemos modificado)