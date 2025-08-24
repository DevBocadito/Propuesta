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
  const productoInput = document.getElementById("producto-input");
  productoInput.disabled = true;
  productoInput.placeholder = "Cargando datos...";
  
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

  fetch(`${API_URL}?action=obtenerDatosIniciales`)
    .then(response => {
      if (!response.ok) throw new Error('Error de red: ' + response.statusText);
      return response.json();
    })
    .then(respuesta => {
      if (respuesta.estado === 'ok') {
        configuracionDescuentos = respuesta.descuentos;
        descuentosPorCantidad = respuesta.descuentosCantidad;
        listaDeProductosCompleta = respuesta.productos;

        const datalist = document.getElementById("lista-productos");
        if (datalist) {
          datalist.innerHTML = '';
          respuesta.productos.forEach(function(p) { 
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
        mostrarNotificacion(respuesta.mensaje, 'error');
        productoInput.placeholder = "Error al cargar datos";
      }
    })
    .catch(error => {
      mostrarNotificacion('Error de conexión: ' + error.message, 'error');
      productoInput.placeholder = "Error de conexión";
    });
}

// ======================================================================
// LÓGICA DE MANEJO DE PRODUCTOS
// ======================================================================

function onProductSelect() {
  if (isLimpiandoCampos) return;
  
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const input = document.getElementById('producto-input');
    const nombreLimpio = input.value;
    const stockField = document.getElementById('stock');
    const precioField = document.getElementById("precioUnitario");

    const productoValido = listaDeProductosCompleta.some(p => p.nombre === nombreLimpio);

    if (productoValido) {
      fetch(`${API_URL}?action=obtenerDatosProducto&nombre=${encodeURIComponent(nombreLimpio)}`)
        .then(response => response.json())
        .then(datos => {
          if (datos) {
            precioField.value = formatearNumero(datos.precio);
            
            if (datos.disponibilidad === 'Disponible') {
              stockField.value = 'DISPONIBLE';
              stockField.style.backgroundColor = '#d4edda';
            } else {
              stockField.value = 'AGOTADO';
              stockField.style.backgroundColor = '#f8d7da';
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
  }, 400);
}

function agregarProducto() {
  console.log("--- Intento de agregar producto ---");
  console.log("El producto seleccionado actualmente es:", productoSeleccionado);

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

  const descuentoCantidad = obtenerDescuentoPorCantidad(productoSeleccionado.nombre, cantidad);
  
  let precioConDescuento = productoSeleccionado.precio;
  let porcentajeDescuentoCantidad = 0;
  let montoDescuentoCantidad = 0;

  if (descuentoCantidad) {
    porcentajeDescuentoCantidad = descuentoCantidad.porcentaje;
    precioConDescuento = productoSeleccionado.precio * (1 - porcentajeDescuentoCantidad / 100);
  }
  
  const subtotal = cantidad * precioConDescuento;
  montoDescuentoCantidad = cantidad * (productoSeleccionado.precio - precioConDescuento);
  
  const nuevoProducto = {
    nombre: productoSeleccionado.nombre,
    cantidad: cantidad,
    precioOriginal: productoSeleccionado.precio,
    subtotal: subtotal,
    porcentajeDescuentoCantidad: porcentajeDescuentoCantidad,
    montoDescuentoCantidad: montoDescuentoCantidad
  };

  productosEnVenta.push(nuevoProducto);
  renderizarTablaProductos();
  limpiarCamposDeProducto();

  let mensaje = "Producto añadido correctamente.";
  if (porcentajeDescuentoCantidad > 0) {
    mensaje += ` ¡Descuento del ${porcentajeDescuentoCantidad}% por cantidad aplicado!`;
  }
  mostrarNotificacion(mensaje, "success");
}

function limpiarCamposDeProducto() {
  isLimpiandoCampos = true;
  document.getElementById('producto-input').value = "";
  document.getElementById('precioUnitario').value = "";
  document.getElementById('cantidad').value = "1";
  const stockField = document.getElementById('stock');
  stockField.value = "";
  stockField.style.backgroundColor = '#e9ecef';
  productoSeleccionado = null;
  document.getElementById('producto-input').focus();
  isLimpiandoCampos = false;
}

function renderizarTablaProductos() {
  const tbody = document.querySelector("#tabla-productos tbody");
  tbody.innerHTML = "";
  productosEnVenta.forEach(function(producto, index) {
    const fila = tbody.insertRow();
    
    let indicadorDescuentoHtml = '';
    if (producto.porcentajeDescuentoCantidad && producto.porcentajeDescuentoCantidad > 0) {
      indicadorDescuentoHtml = ` <span style="color: #28a745; font-size: 0.8em; font-weight: bold;">(-${producto.porcentajeDescuentoCantidad}% desc.)</span>`;
    }

    fila.innerHTML = `
      <td data-label="Producto">${producto.nombre}${indicadorDescuentoHtml}</td>
      <td data-label="Cant.">${producto.cantidad}</td>
      <td data-label="Subtotal">${formatearNumero(producto.subtotal)}</td>
      <td data-label="Acción"><button type="button" class="btn-eliminar" onclick="removerProducto(${index})">Eliminar</button></td>
    `;
  });
  calcularDescuentos();
}

function removerProducto(indice) {
  productosEnVenta.splice(indice, 1);
  renderizarTablaProductos();
  mostrarNotificacion("Producto eliminado.", "success");
}

function obtenerDescuentoPorCantidad(nombreProducto, cantidad) {
  const descuentosDelProducto = descuentosPorCantidad.filter(d => d.producto === nombreProducto);
  let mejorDescuento = null;
  for (const descuento of descuentosDelProducto) {
    if (cantidad >= descuento.cantidadMinima) {
      if (!mejorDescuento || descuento.cantidadMinima > mejorDescuento.cantidadMinima) {
        mejorDescuento = descuento;
      }
    }
  }
  return mejorDescuento;
}


// ======================================================================
// LÓGICA DE CÁLCULOS Y FINALIZACIÓN DE VENTA
// ======================================================================

function calcularDescuentos() {
  const tipoCliente = document.getElementById('tipoCliente').value;
  const totalSinDescuento = productosEnVenta.reduce((total, producto) => total + producto.subtotal, 0);
  const descuentoAplicable = configuracionDescuentos.find(desc => desc.tipo === tipoCliente && totalSinDescuento >= desc.montoMinimo);
  const infoDescuento = document.getElementById('info-descuento');
  const totalElement = document.getElementById('total-general');

  if (descuentoAplicable && totalSinDescuento > 0) {
    const montoDescuento = totalSinDescuento * (descuentoAplicable.porcentaje / 100);
    const totalConDescuento = totalSinDescuento - montoDescuento;
    const totalFinalRedondeado = redondearPrecioEspecial(totalConDescuento);
    
    // Si tienes los elementos para mostrar el desglose del descuento, actualízalos aquí.
    // document.getElementById('subtotal-antes').textContent = formatearNumero(totalSinDescuento);
    // document.getElementById('porcentaje-descuento').textContent = descuentoAplicable.porcentaje + '%';
    // document.getElementById('monto-descuento').textContent = formatearNumero(Math.round(montoDescuento));
    
    totalElement.textContent = 'Total Venta: ' + formatearNumero(totalFinalRedondeado);
    if(infoDescuento) infoDescuento.style.display = 'block';
  } else {
    const totalFinalRedondeado = redondearPrecioEspecial(totalSinDescuento);
    totalElement.textContent = 'Total Venta: ' + formatearNumero(totalFinalRedondeado);
    if(infoDescuento) infoDescuento.style.display = 'none';
  }
}

function redondearPrecioEspecial(numero) {
    if (typeof numero !== 'number' || isNaN(numero)) return 0;
    const base = Math.floor(numero / 100) * 100;
    const residuo = numero % 100;
    if (residuo === 0) return numero;
    return residuo > 50 ? base + 100 : base + 50;
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
  const modal = document.getElementById('modal-confirmacion');
  const resumen = document.getElementById('resumen-confirmacion');
  const vendedor = document.getElementById("vendedor").value;
  const fecha = document.getElementById("fecha").value;
  const tipoCliente = document.getElementById("tipoCliente").value;
  const medioPago = document.getElementById("medioPago").value;
  const totalFinalTexto = document.getElementById('total-general').textContent.replace('Total Venta: ', '');
  
  const fechaFormateada = new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  
  resumen.innerHTML = `<p><strong>Vendedor:</strong> ${vendedor}</p>
                     <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                     <p><strong>Tipo Cliente:</strong> ${tipoCliente}</p>
                     <p><strong>Método de Pago:</strong> ${medioPago}</p>
                     <p><strong>Productos:</strong> ${productosEnVenta.length}</p>
                     <p style="font-size: 1.2rem; margin-top: 1rem;"><strong>Total Final: ${totalFinalTexto}</strong></p>`;
  modal.style.display = 'block';
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
    headers: { 'Content-Type': 'application/json' },
    redirect: "follow",
    body: JSON.stringify({
      action: 'guardarVenta',
      datosVenta: datosVenta
    })
  })
  .then(response => response.json())
  .then(respuesta => {
     if (respuesta.status === 'ok') {
       const urlDetalle = `detalle.html?id=${respuesta.idVenta}`;
       const mensajeExito = `Venta guardada. <a href="${urlDetalle}" target="_top" style="color: white; font-weight: bold;">Ver Detalle</a>`;
       mostrarNotificacion(mensajeExito, 'success');
       
       document.getElementById("formVenta").reset();
       productosEnVenta = [];
       renderizarTablaProductos();
       establecerFechaActual();
       limpiarCamposDeProducto();
     } else {
       mostrarNotificacion(respuesta.message, 'error');
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
  console.log("Iniciando función para establecer la fecha...");
  const fechaInput = document.getElementById("fecha");
  if (fechaInput) {
    console.log("Elemento 'fecha' encontrado. Estableciendo valor.");
    const hoy = new Date();
    fechaInput.value = hoy.toISOString().split('T')[0];
  } else {
    console.error("¡Error! No se encontró el elemento HTML con id='fecha'.");
  }
}