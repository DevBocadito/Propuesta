// ======================================================================
// CONFIGURACIÓN PRINCIPAL
// ======================================================================
const API_URL = 'AQUÍ_VA_LA_URL_DE_TU_WEB_APP'; // <-- ¡IMPORTANTE! Pega tu URL aquí.

// ======================================================================
// VARIABLES GLOBALES DE ESTADO
// ======================================================================
var productoSeleccionado = null;
var productosEnVenta = []; [cite_start]// [cite: 14]
var listaDeProductosCompleta = []; [cite_start]// [cite: 15]
var configuracionDescuentos = []; [cite_start]// [cite: 15]
var descuentosPorCantidad = []; [cite_start]// [cite: 15]
var debounceTimer; [cite_start]// [cite: 15]
var isLimpiandoCampos = false; [cite_start]// [cite: 15]

// ======================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ======================================================================
document.addEventListener("DOMContentLoaded", function() {
  [cite_start]const productoInput = document.getElementById("producto-input"); // [cite: 16]
  productoInput.disabled = true; [cite_start]// [cite: 16]
  productoInput.placeholder = "Cargando datos..."; [cite_start]// [cite: 16]
  
  cargarDatosIniciales();
  
  const addButton = document.getElementById('btn-agregar-producto');
  if(addButton){
      addButton.addEventListener('click', agregarProducto);
      console.log("Listener para 'agregarProducto' añadido correctamente.");
  } else {
      console.error("No se encontró el botón con id='btn-agregar-producto' para añadir el listener.");
  }

  document.getElementById('formVenta').addEventListener('submit', handleFormSubmit);
  document.getElementById('producto-input').addEventListener('input', onProductSelect);
  document.getElementById('tipoCliente').addEventListener('change', calcularDescuentos);
  document.getElementById('btn-cancelar-venta').addEventListener('click', cerrarModalConfirmacion); [cite_start]// [cite: 24]
  document.getElementById('btn-confirmar-venta').addEventListener('click', confirmarVenta); [cite_start]// [cite: 24]
  
  establecerFechaActual(); [cite_start]// [cite: 24]
});

/**
 * Carga los datos esenciales (productos, descuentos, etc.) desde la API al iniciar.
 */
function cargarDatosIniciales() {
  const productoInput = document.getElementById("producto-input"); [cite_start]// [cite: 16]
  const selectCliente = document.getElementById('tipoCliente'); [cite_start]// [cite: 16]
  const opcionCargaCliente = document.getElementById('opcion-carga-cliente'); [cite_start]// [cite: 16]

  fetch(`${API_URL}?action=obtenerDatosIniciales`)
    .then(response => {
      if (!response.ok) throw new Error('Error de red: ' + response.statusText);
      return response.json();
    })
    .then(respuesta => {
      if (respuesta.estado === 'ok') {
        [cite_start]configuracionDescuentos = respuesta.descuentos; // [cite: 16]
        descuentosPorCantidad = respuesta.descuentosCantidad; [cite_start]// [cite: 16]
        listaDeProductosCompleta = respuesta.productos; [cite_start]// [cite: 16]

        const datalist = document.getElementById("lista-productos"); [cite_start]// [cite: 17]
        if (datalist) {
          datalist.innerHTML = ''; [cite_start]// [cite: 17]
          respuesta.productos.forEach(function(p) { 
            [cite_start]datalist.innerHTML += `<option value="${p.nombre}"></option>`; // [cite: 17]
          });
        }
        
        const tiposCliente = respuesta.tiposCliente || []; [cite_start]// [cite: 18, 19]
        opcionCargaCliente.textContent = 'Selecciona...'; [cite_start]// [cite: 19]
        
        tiposCliente.forEach(tipo => {
          [cite_start]const option = document.createElement('option'); // [cite: 19]
          option.value = tipo; [cite_start]// [cite: 19]
          option.textContent = tipo; [cite_start]// [cite: 19]
          selectCliente.appendChild(option); [cite_start]// [cite: 19]
        });
        selectCliente.disabled = false; [cite_start]// [cite: 20]
        productoInput.disabled = false; [cite_start]// [cite: 20]
        productoInput.placeholder = "Escribe para buscar un producto"; [cite_start]// [cite: 21]
      } else {
        mostrarNotificacion(respuesta.mensaje, 'error'); [cite_start]// [cite: 21]
        productoInput.placeholder = "Error al cargar datos"; [cite_start]// [cite: 22]
      }
    })
    .catch(error => {
      [cite_start]mostrarNotificacion('Error de conexión: ' + error.message, 'error'); // [cite: 23]
      productoInput.placeholder = "Error de conexión"; [cite_start]// [cite: 23]
    });
}

// ======================================================================
// LÓGICA DE MANEJO DE PRODUCTOS
// ======================================================================

function onProductSelect() {
  if (isLimpiandoCampos) return; [cite_start]// [cite: 24]
  
  clearTimeout(debounceTimer); [cite_start]// [cite: 24]
  [cite_start]debounceTimer = setTimeout(() => { // [cite: 25]
    const input = document.getElementById('producto-input'); [cite_start]// [cite: 25]
    const nombreLimpio = input.value; [cite_start]// [cite: 25]
    const stockField = document.getElementById('stock'); [cite_start]// [cite: 25]
    const precioField = document.getElementById("precioUnitario");

    const productoValido = listaDeProductosCompleta.some(p => p.nombre === nombreLimpio);

    if (productoValido) {
      fetch(`${API_URL}?action=obtenerDatosProducto&nombre=${encodeURIComponent(nombreLimpio)}`)
        .then(response => response.json())
        .then(datos => {
          if (datos) {
            [cite_start]precioField.value = formatearNumero(datos.precio); // [cite: 26]
            
            if (datos.disponibilidad === 'Disponible') {
              stockField.value = 'DISPONIBLE'; [cite_start]// [cite: 26]
              stockField.style.backgroundColor = '#d4edda'; [cite_start]// [cite: 26]
            } else {
              stockField.value = 'AGOTADO'; [cite_start]// [cite: 27]
              stockField.style.backgroundColor = '#f8d7da'; [cite_start]// [cite: 27]
            }

            [cite_start]productoSeleccionado = { // [cite: 27]
              [cite_start]nombre: nombreLimpio, // [cite: 28]
              [cite_start]precio: datos.precio, // [cite: 28]
              [cite_start]disponibilidad: datos.disponibilidad // [cite: 28]
            };
          }
        })
        .catch(error => console.error("Error al obtener datos del producto:", error));
    } else {
      precioField.value = ""; [cite_start]// [cite: 30]
      stockField.value = ""; [cite_start]// [cite: 30]
      stockField.style.backgroundColor = '#e9ecef'; [cite_start]// [cite: 30]
      productoSeleccionado = null; [cite_start]// [cite: 31]
    }
  }, 400); [cite_start]// [cite: 31]
}

function agregarProducto() {
  console.log("--- Intento de agregar producto ---");
  console.log("El producto seleccionado actualmente es:", productoSeleccionado);

  if (!productoSeleccionado) {
    mostrarNotificacion("Debe seleccionar un producto válido.", "error"); [cite_start]// [cite: 32]
    return; [cite_start]// [cite: 32]
  }
  if (productoSeleccionado.disponibilidad === 'Agotado') {
    mostrarNotificacion("Este producto está agotado y no se puede añadir.", "error"); [cite_start]// [cite: 33]
    return;
  }
  const cantidad = parseInt(document.getElementById("cantidad").value, 10); [cite_start]// [cite: 34]
  if (!cantidad || cantidad <= 0) {
    mostrarNotificacion("La cantidad debe ser mayor a 0.", "error"); [cite_start]// [cite: 34]
    return; [cite_start]// [cite: 35]
  }

  const descuentoCantidad = obtenerDescuentoPorCantidad(productoSeleccionado.nombre, cantidad); [cite_start]// [cite: 36]
  
  let precioConDescuento = productoSeleccionado.precio; [cite_start]// [cite: 39]
  let porcentajeDescuentoCantidad = 0; [cite_start]// [cite: 39]
  let montoDescuentoCantidad = 0; [cite_start]// [cite: 40]

  if (descuentoCantidad) {
    porcentajeDescuentoCantidad = descuentoCantidad.porcentaje; [cite_start]// [cite: 40]
    precioConDescuento = productoSeleccionado.precio * (1 - porcentajeDescuentoCantidad / 100); [cite_start]// [cite: 41]
  }
  
  const subtotal = cantidad * precioConDescuento; [cite_start]// [cite: 41]
  montoDescuentoCantidad = cantidad * (productoSeleccionado.precio - precioConDescuento); [cite_start]// [cite: 42]
  
  const nuevoProducto = {
    [cite_start]nombre: productoSeleccionado.nombre, // [cite: 42]
    [cite_start]cantidad: cantidad, // [cite: 42]
    [cite_start]precioOriginal: productoSeleccionado.precio, // [cite: 42]
    [cite_start]subtotal: subtotal, // [cite: 42]
    [cite_start]porcentajeDescuentoCantidad: porcentajeDescuentoCantidad, // [cite: 42]
    [cite_start]montoDescuentoCantidad: montoDescuentoCantidad // [cite: 42]
  };

  productosEnVenta.push(nuevoProducto); [cite_start]// [cite: 43]
  renderizarTablaProductos(); [cite_start]// [cite: 43]
  limpiarCamposDeProducto(); [cite_start]// [cite: 43]

  let mensaje = "Producto añadido correctamente."; [cite_start]// [cite: 43]
  if (porcentajeDescuentoCantidad > 0) {
    mensaje += ` ¡Descuento del ${porcentajeDescuentoCantidad}% por cantidad aplicado!`; [cite_start]// [cite: 44]
  }
  mostrarNotificacion(mensaje, "success"); [cite_start]// [cite: 45]
}

function limpiarCamposDeProducto() {
  isLimpiandoCampos = true; [cite_start]// [cite: 45]
  document.getElementById('producto-input').value = ""; [cite_start]// [cite: 45]
  document.getElementById('precioUnitario').value = ""; [cite_start]// [cite: 46]
  document.getElementById('cantidad').value = "1"; [cite_start]// [cite: 46]
  const stockField = document.getElementById('stock'); [cite_start]// [cite: 46]
  stockField.value = ""; [cite_start]// [cite: 46]
  stockField.style.backgroundColor = '#e9ecef'; [cite_start]// [cite: 46]
  productoSeleccionado = null; [cite_start]// [cite: 47]
  document.getElementById('producto-input').focus(); [cite_start]// [cite: 47]
  isLimpiandoCampos = false; [cite_start]// [cite: 47]
}

function renderizarTablaProductos() {
  const tbody = document.querySelector("#tabla-productos tbody"); [cite_start]// [cite: 47]
  tbody.innerHTML = ""; [cite_start]// [cite: 48]
  [cite_start]productosEnVenta.forEach(function(producto, index) { // [cite: 48]
    const fila = tbody.insertRow(); [cite_start]// [cite: 48]
    
    let indicadorDescuentoHtml = ''; [cite_start]// [cite: 48]
    [cite_start]if (producto.porcentajeDescuentoCantidad && producto.porcentajeDescuentoCantidad > 0) { // [cite: 48]
      indicadorDescuentoHtml = ` <span style="color: #28a745; font-size: 0.8em; font-weight: bold;">(-${producto.porcentajeDescuentoCantidad}% desc.)</span>`; [cite_start]// [cite: 48, 49]
    }

    fila.innerHTML = `
      <td data-label="Producto">${producto.nombre}${indicadorDescuentoHtml}</td>
      <td data-label="Cant.">${producto.cantidad}</td>
      <td data-label="Subtotal">${formatearNumero(producto.subtotal)}</td>
      <td data-label="Acción"><button type="button" class="btn-eliminar" onclick="removerProducto(${index})">Eliminar</button></td>
    `;
  });
  calcularDescuentos(); [cite_start]// [cite: 50]
}

function removerProducto(indice) {
  productosEnVenta.splice(indice, 1); [cite_start]// [cite: 51]
  renderizarTablaProductos(); [cite_start]// [cite: 51]
  mostrarNotificacion("Producto eliminado.", "success"); [cite_start]// [cite: 51]
}

function obtenerDescuentoPorCantidad(nombreProducto, cantidad) {
  const descuentosDelProducto = descuentosPorCantidad.filter(d => d.producto === nombreProducto); [cite_start]// [cite: 79]
  let mejorDescuento = null; [cite_start]// [cite: 79]
  [cite_start]for (const descuento of descuentosDelProducto) { // [cite: 80]
    [cite_start]if (cantidad >= descuento.cantidadMinima) { // [cite: 80]
      [cite_start]if (!mejorDescuento || descuento.cantidadMinima > mejorDescuento.cantidadMinima) { // [cite: 80]
        mejorDescuento = descuento; [cite_start]// [cite: 80]
      }
    }
  }
  return mejorDescuento; [cite_start]// [cite: 81]
}


// ======================================================================
// LÓGICA DE CÁLCULOS Y FINALIZACIÓN DE VENTA
// ======================================================================

function calcularDescuentos() {
  const tipoCliente = document.getElementById('tipoCliente').value; [cite_start]// [cite: 52]
  const totalSinDescuento = productosEnVenta.reduce((total, producto) => total + producto.subtotal, 0); [cite_start]// [cite: 53]
  const descuentoAplicable = configuracionDescuentos.find(desc => desc.tipo === tipoCliente && totalSinDescuento >= desc.montoMinimo); [cite_start]// [cite: 54]
  const infoDescuento = document.getElementById('info-descuento'); [cite_start]// [cite: 54]
  const totalElement = document.getElementById('total-general'); [cite_start]// [cite: 54]

  [cite_start]if (descuentoAplicable && totalSinDescuento > 0) { // [cite: 55]
    const montoDescuento = totalSinDescuento * (descuentoAplicable.porcentaje / 100); [cite_start]// [cite: 55]
    const totalConDescuento = totalSinDescuento - montoDescuento; [cite_start]// [cite: 56]
    const totalFinalRedondeado = redondearPrecioEspecial(totalConDescuento); [cite_start]// [cite: 56]
    
    document.getElementById('subtotal-antes').textContent = formatearNumero(totalSinDescuento); [cite_start]// [cite: 56]
    document.getElementById('porcentaje-descuento').textContent = descuentoAplicable.porcentaje + '%'; [cite_start]// [cite: 57]
    document.getElementById('monto-descuento').textContent = formatearNumero(Math.round(montoDescuento)); [cite_start]// [cite: 57]
    totalElement.textContent = 'Total Venta: ' + formatearNumero(totalFinalRedondeado); [cite_start]// [cite: 57]
    infoDescuento.style.display = 'block'; [cite_start]// [cite: 57]
  } else {
    const totalFinalRedondeado = redondearPrecioEspecial(totalSinDescuento); [cite_start]// [cite: 58]
    totalElement.textContent = 'Total Venta: ' + formatearNumero(totalFinalRedondeado); [cite_start]// [cite: 58]
    infoDescuento.style.display = 'none'; [cite_start]// [cite: 59]
  }
}

function redondearPrecioEspecial(numero) {
    if (typeof numero !== 'number' || isNaN(numero)) return 0; [cite_start]// [cite: 59]
    const base = Math.floor(numero / 100) * 100; [cite_start]// [cite: 60]
    const residuo = numero % 100; [cite_start]// [cite: 60]
    if (residuo === 0) return numero; [cite_start]// [cite: 60]
    return residuo > 50 ? base + 100 : base + 50; [cite_start]// [cite: 61]
}

function handleFormSubmit(event) {
  event.preventDefault(); [cite_start]// [cite: 62]
  if (productosEnVenta.length === 0) {
    mostrarNotificacion("Debe añadir al menos un producto.", "error"); [cite_start]// [cite: 62]
    return; [cite_start]// [cite: 63]
  }
  mostrarModalConfirmacion(); [cite_start]// [cite: 63]
}

function mostrarModalConfirmacion() {
  const modal = document.getElementById('modal-confirmacion'); [cite_start]// [cite: 63]
  const resumen = document.getElementById('resumen-confirmacion'); [cite_start]// [cite: 64]
  const vendedor = document.getElementById("vendedor").value; [cite_start]// [cite: 64]
  const fecha = document.getElementById("fecha").value; [cite_start]// [cite: 64]
  const tipoCliente = document.getElementById("tipoCliente").value; [cite_start]// [cite: 64]
  const medioPago = document.getElementById("medioPago").value; [cite_start]// [cite: 64]
  const totalFinalTexto = document.getElementById('total-general').textContent.replace('Total Venta: ', '');
  
  const fechaFormateada = new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }); [cite_start]// [cite: 70]
  
  // La lógica de cálculo de descuento del modal se simplifica, ya que el total ya está calculado
  resumen.innerHTML = `<p><strong>Vendedor:</strong> ${vendedor}</p>
                     <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                     <p><strong>Tipo Cliente:</strong> ${tipoCliente}</p>
                     <p><strong>Método de Pago:</strong> ${medioPago}</p>
                     <p><strong>Productos:</strong> ${productosEnVenta.length}</p>
                     <p style="font-size: 1.2rem; margin-top: 1rem;"><strong>Total Final: ${totalFinalTexto}</strong></p>`; [cite_start]// [cite: 71]
  modal.style.display = 'block'; [cite_start]// [cite: 71]
}

function cerrarModalConfirmacion() {
  document.getElementById('modal-confirmacion').style.display = 'none'; [cite_start]// [cite: 72]
}

function confirmarVenta() {
  cerrarModalConfirmacion(); [cite_start]// [cite: 72]
  
  const datosVenta = {
    [cite_start]detallesVenta: { // [cite: 73]
      fecha: document.getElementById("fecha").value,
      vendedor: document.getElementById("vendedor").value,
      tipoCliente: document.getElementById("tipoCliente").value,
      medioPago: document.getElementById("medioPago").value,
      observaciones: document.getElementById("observaciones").value,
    },
    [cite_start]productosVendidos: productosEnVenta // [cite: 73]
  };

  const boton = document.getElementById("btn-guardar-venta"); [cite_start]// [cite: 74]
  boton.disabled = true; [cite_start]// [cite: 74]
  boton.textContent = "Guardando..."; [cite_start]// [cite: 74]

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Google Apps Script a veces tiene problemas con POST anónimos, por lo que se debe manejar el redireccionamiento de forma especial
    redirect: "follow",
    body: JSON.stringify({
      action: 'guardarVenta',
      datosVenta: datosVenta
    })
  })
  .then(response => response.json())
  .then(respuesta => {
     if (respuesta.status === 'ok') {
       // La redirección ideal no es posible directamente después de un POST a Apps Script desde un cliente externo.
       // En su lugar, mostramos un mensaje con un enlace.
       const urlDetalle = `detalle.html?id=${respuesta.idVenta}`; // Asumiendo que crearás una página detalle.html
       [cite_start]const mensajeExito = `Venta guardada. <a href="${urlDetalle}" target="_top" style="color: white; font-weight: bold;">Ver Detalle</a>`; // [cite: 75]
       mostrarNotificacion(mensajeExito, 'success'); [cite_start]// [cite: 75]
       
       document.getElementById("formVenta").reset(); [cite_start]// [cite: 75]
       productosEnVenta = []; [cite_start]// [cite: 75]
       renderizarTablaProductos(); [cite_start]// [cite: 76]
       establecerFechaActual(); [cite_start]// [cite: 76]
       limpiarCamposDeProducto(); [cite_start]// [cite: 76]
     } else {
       mostrarNotificacion(respuesta.message, 'error'); [cite_start]// [cite: 76]
     }
  })
  .catch(error => {
    [cite_start]mostrarNotificacion('Error de conexión al guardar: ' + error.message, 'error'); // [cite: 77]
  })
  .finally(() => {
    [cite_start]boton.disabled = false; // [cite: 76]
    boton.textContent = "Guardar Venta"; [cite_start]// [cite: 76]
  });
}

function establecerFechaActual() {
  console.log("Iniciando función para establecer la fecha...");
  const fechaInput = document.getElementById("fecha"); [cite_start]// [cite: 78]
  if (fechaInput) {
    console.log("Elemento 'fecha' encontrado. Estableciendo valor.");
    const hoy = new Date(); [cite_start]// [cite: 78]
    fechaInput.value = hoy.toISOString().split('T')[0]; [cite_start]// [cite: 78]
  } else {
    console.error("¡Error! No se encontró el elemento HTML con id='fecha'.");
  }
}