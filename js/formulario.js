// ======================================================================
// CONFIGURACIÓN PRINCIPAL
// ======================================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbze58f6g0spQGYMVonYKvbm-pQtJPFox4sXLashfwgJG_0L4AQV3N0Xrj5icdsX3BtICw/exec';

// ======================================================================
// VARIABLES GLOBALES DE ESTADO
// ======================================================================
let productoSeleccionado = null;
let productosEnVenta = [];
let listaDeProductosCompleta = [];
let configuracionDescuentos = [];
let descuentosPorCantidad = [];
let debounceTimer;
let isLimpiandoCampos = false;

// Estados de la aplicación
const APP_STATES = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
  SAVING: 'saving'
};

let currentState = APP_STATES.LOADING;

// ======================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ======================================================================
document.addEventListener("DOMContentLoaded", function() {
  console.log("🚀 Iniciando Sistema de Ventas...");
  
  inicializarInterfaz();
  configurarEventListeners();
  cargarDatosIniciales();
  establecerFechaActual();
});

/**
 * Configura el estado inicial de la interfaz
 */
function inicializarInterfaz() {
  const productoInput = document.getElementById("producto-input");
  const tipoClienteSelect = document.getElementById("tipoCliente");
  
  // Estados iniciales
  productoInput.disabled = true;
  productoInput.placeholder = "Cargando datos...";
  tipoClienteSelect.disabled = true;
  
  // Añadir indicadores visuales de carga
  mostrarEstadoCarga(true);
}

/**
 * Configura todos los event listeners
 */
function configurarEventListeners() {
  // Eventos principales
  document.getElementById('btn-agregar-producto')?.addEventListener('click', agregarProducto);
  document.getElementById('formVenta').addEventListener('submit', handleFormSubmit);
  document.getElementById('producto-input').addEventListener('input', onProductSelect);
  document.getElementById('tipoCliente').addEventListener('change', calcularDescuentos);
  document.getElementById('cantidad').addEventListener('input', onCantidadChange);
  
  // Eventos del modal
  document.getElementById('btn-cancelar-venta').addEventListener('click', cerrarModalConfirmacion);
  document.getElementById('btn-confirmar-venta').addEventListener('click', confirmarVenta);
  
  // Eventos de teclado para mejor UX
  document.getElementById('producto-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('cantidad').focus();
    }
  });
  
  document.getElementById('cantidad').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      agregarProducto();
    }
  });
  
  console.log("✅ Event listeners configurados");
}

/**
 * Muestra/oculta indicadores de carga
 */
function mostrarEstadoCarga(mostrar) {
  const elements = ['producto-input', 'tipoCliente'];
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.opacity = mostrar ? '0.6' : '1';
    }
  });
}

// ======================================================================
// GESTIÓN DE DATOS INICIALES
// ======================================================================

/**
 * Carga los datos esenciales desde la API
 */
async function cargarDatosIniciales() {
  const productoInput = document.getElementById("producto-input");
  const selectCliente = document.getElementById('tipoCliente');
  const opcionCargaCliente = document.getElementById('opcion-carga-cliente');

  try {
    currentState = APP_STATES.LOADING;
    console.log("📡 Cargando datos iniciales...");
    
    const response = await fetch(`${API_URL}?action=obtenerDatosIniciales`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const respuesta = await response.json();
    
    if (respuesta.estado === 'ok') {
      await procesarDatosIniciales(respuesta);
      currentState = APP_STATES.READY;
      console.log("✅ Datos cargados correctamente");
    } else {
      throw new Error(respuesta.mensaje || 'Error desconocido al cargar datos');
    }
    
  } catch (error) {
    currentState = APP_STATES.ERROR;
    console.error("❌ Error cargando datos:", error);
    mostrarNotificacion(`Error de conexión: ${error.message}`, 'error');
    productoInput.placeholder = "Error al cargar datos";
  } finally {
    mostrarEstadoCarga(false);
  }
}

/**
 * Procesa y aplica los datos recibidos de la API
 */
async function procesarDatosIniciales(respuesta) {
  // Guardar datos globalmente
  configuracionDescuentos = respuesta.descuentos || [];
  descuentosPorCantidad = respuesta.descuentosCantidad || [];
  listaDeProductosCompleta = respuesta.productos || [];

  // Configurar datalist de productos
  const datalist = document.getElementById("lista-productos");
  if (datalist) {
    datalist.innerHTML = '';
    respuesta.productos.forEach(producto => {
      const option = document.createElement('option');
      option.value = producto.nombre;
      datalist.appendChild(option);
    });
  }
  
  // Configurar tipos de cliente
  const selectCliente = document.getElementById('tipoCliente');
  const opcionCargaCliente = document.getElementById('opcion-carga-cliente');
  
  if (selectCliente && opcionCargaCliente) {
    opcionCargaCliente.textContent = 'Selecciona tipo de cliente...';
    
    const tiposCliente = respuesta.tiposCliente || [];
    tiposCliente.forEach(tipo => {
      const option = document.createElement('option');
      option.value = tipo;
      option.textContent = tipo;
      selectCliente.appendChild(option);
    });
    
    selectCliente.disabled = false;
  }
  
  // Habilitar campo de producto
  const productoInput = document.getElementById("producto-input");
  if (productoInput) {
    productoInput.disabled = false;
    productoInput.placeholder = "Escribe para buscar un producto...";
  }
  
  mostrarNotificacion(`✅ ${respuesta.productos.length} productos cargados`, 'success');
}

// ======================================================================
// LÓGICA DE MANEJO DE PRODUCTOS
// ======================================================================

/**
 * Maneja la selección de productos con debounce
 */
function onProductSelect() {
  if (isLimpiandoCampos) return;
  
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    await procesarSeleccionProducto();
  }, 300);
}

/**
 * Procesa la selección de un producto específico
 */
async function procesarSeleccionProducto() {
  const input = document.getElementById('producto-input');
  const nombreLimpio = input.value.trim();
  const stockField = document.getElementById('stock');
  const precioField = document.getElementById("precioUnitario");

  if (!nombreLimpio) {
    limpiarCamposProducto();
    return;
  }

  const productoValido = listaDeProductosCompleta.some(p => p.nombre === nombreLimpio);

  if (productoValido) {
    try {
      mostrarCargandoProducto(true);
      
      const response = await fetch(`${API_URL}?action=obtenerDatosProducto&nombre=${encodeURIComponent(nombreLimpio)}`);
      const datos = await response.json();
      
      if (datos) {
        aplicarDatosProducto(datos, nombreLimpio);
      } else {
        throw new Error('Producto no encontrado');
      }
      
    } catch (error) {
      console.error("Error al obtener datos del producto:", error);
      mostrarNotificacion(`Error al cargar producto: ${error.message}`, 'error');
      limpiarCamposProducto();
    } finally {
      mostrarCargandoProducto(false);
    }
  } else {
    limpiarCamposProducto();
  }
}

/**
 * Aplica los datos del producto seleccionado a la interfaz
 */
function aplicarDatosProducto(datos, nombreProducto) {
  const precioField = document.getElementById("precioUnitario");
  const stockField = document.getElementById('stock');
  
  precioField.value = formatearNumero(datos.precio);
  
  if (datos.disponibilidad === 'Disponible') {
    stockField.value = 'DISPONIBLE';
    stockField.style.backgroundColor = 'var(--success-light)';
    stockField.style.color = 'var(--success-color)';
  } else {
    stockField.value = 'AGOTADO';
    stockField.style.backgroundColor = 'var(--danger-light)';
    stockField.style.color = 'var(--danger-color)';
  }

  productoSeleccionado = {
    nombre: nombreProducto,
    precio: datos.precio,
    disponibilidad: datos.disponibilidad,
    categoria: datos.categoria || 'Sin categoría'
  };
  
  // Auto-calcular descuento por cantidad si hay cantidad
  const cantidad = parseInt(document.getElementById("cantidad").value, 10);
  if (cantidad > 1) {
    mostrarVistaPrevia(nombreProducto, cantidad, datos.precio);
  }
}

/**
 * Muestra vista previa del descuento por cantidad
 */
function mostrarVistaPrevia(nombreProducto, cantidad, precio) {
  const descuentoCantidad = obtenerDescuentoPorCantidad(nombreProducto, cantidad);
  
  if (descuentoCantidad) {
    const precioConDescuento = precio * (1 - descuentoCantidad.porcentaje / 100);
    const ahorro = (precio - precioConDescuento) * cantidad;
    
    mostrarNotificacion(
      `💰 Descuento ${descuentoCantidad.porcentaje}% aplicable. Ahorro: ${formatearNumero(ahorro)}`, 
      'info'
    );
  }
}

/**
 * Maneja cambios en la cantidad
 */
function onCantidadChange() {
  if (productoSeleccionado) {
    const cantidad = parseInt(document.getElementById("cantidad").value, 10);
    if (cantidad > 0) {
      mostrarVistaPrevia(productoSeleccionado.nombre, cantidad, productoSeleccionado.precio);
    }
  }
}

/**
 * Muestra/oculta indicador de carga en campos de producto
 */
function mostrarCargandoProducto(mostrar) {
  const precioField = document.getElementById("precioUnitario");
  const stockField = document.getElementById('stock');
  
  if (mostrar) {
    precioField.value = "Cargando...";
    stockField.value = "...";
    stockField.style.backgroundColor = 'var(--gray-100)';
  }
}

/**
 * Limpia los campos relacionados con el producto
 */
function limpiarCamposProducto() {
  const precioField = document.getElementById("precioUnitario");
  const stockField = document.getElementById('stock');
  
  precioField.value = "";
  stockField.value = "";
  stockField.style.backgroundColor = 'var(--gray-100)';
  stockField.style.color = 'var(--gray-500)';
  productoSeleccionado = null;
}

/**
 * Añade un producto a la venta
 */
function agregarProducto() {
  console.log("🛒 Intentando agregar producto...");
  
  // Validaciones
  if (!productoSeleccionado) {
    mostrarNotificacion("❌ Debe seleccionar un producto válido", "error");
    return;
  }
  
  if (productoSeleccionado.disponibilidad === 'Agotado') {
    mostrarNotificacion("❌ Este producto está agotado", "error");
    return;
  }
  
  const cantidad = parseInt(document.getElementById("cantidad").value, 10);
  if (!cantidad || cantidad <= 0) {
    mostrarNotificacion("❌ La cantidad debe ser mayor a 0", "error");
    return;
  }

  try {
    const nuevoProducto = crearProductoVenta(cantidad);
    productosEnVenta.push(nuevoProducto);
    
    renderizarTablaProductos();
    limpiarFormularioProducto();
    
    const mensaje = nuevoProducto.porcentajeDescuentoCantidad > 0 
      ? `✅ Producto añadido con ${nuevoProducto.porcentajeDescuentoCantidad}% descuento`
      : "✅ Producto añadido correctamente";
      
    mostrarNotificacion(mensaje, "success");
    
    console.log("✅ Producto agregado:", nuevoProducto);
    
  } catch (error) {
    console.error("Error al agregar producto:", error);
    mostrarNotificacion("❌ Error al agregar producto", "error");
  }
}

/**
 * Crea el objeto de producto para la venta
 */
function crearProductoVenta(cantidad) {
  const descuentoCantidad = obtenerDescuentoPorCantidad(productoSeleccionado.nombre, cantidad);
  
  let precioConDescuento = productoSeleccionado.precio;
  let porcentajeDescuentoCantidad = 0;
  let montoDescuentoCantidad = 0;

  if (descuentoCantidad) {
    porcentajeDescuentoCantidad = descuentoCantidad.porcentaje;
    precioConDescuento = productoSeleccionado.precio * (1 - porcentajeDescuentoCantidad / 100);
    montoDescuentoCantidad = cantidad * (productoSeleccionado.precio - precioConDescuento);
  }
  
  const subtotal = cantidad * precioConDescuento;
  
  return {
    nombre: productoSeleccionado.nombre,
    cantidad: cantidad,
    precioOriginal: productoSeleccionado.precio,
    subtotal: subtotal,
    porcentajeDescuentoCantidad: porcentajeDescuentoCantidad,
    montoDescuentoCantidad: montoDescuentoCantidad
  };
}

/**
 * Limpia el formulario de producto después de agregarlo
 */
function limpiarFormularioProducto() {
  isLimpiandoCampos = true;
  
  document.getElementById('producto-input').value = "";
  document.getElementById('precioUnitario').value = "";
  document.getElementById('cantidad').value = "1";
  limpiarCamposProducto();
  
  // Enfocar el campo de producto para siguiente entrada
  setTimeout(() => {
    document.getElementById('producto-input').focus();
    isLimpiandoCampos = false;
  }, 100);
}

/**
 * Renderiza la tabla de productos en venta
 */
function renderizarTablaProductos() {
  const tbody = document.querySelector("#tabla-productos tbody");
  tbody.innerHTML = "";
  
  if (productosEnVenta.length === 0) {
    const fila = tbody.insertRow();
    fila.innerHTML = `
      <td colspan="4" style="text-align: center; color: var(--gray-500); padding: 2rem;">
        <i class="fas fa-shopping-cart" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
        No hay productos agregados
      </td>
    `;
    return;
  }
  
  productosEnVenta.forEach(function(producto, index) {
    const fila = tbody.insertRow();
    
    let indicadorDescuentoHtml = '';
    if (producto.porcentajeDescuentoCantidad && producto.porcentajeDescuentoCantidad > 0) {
      indicadorDescuentoHtml = `<span class="discount-badge">-${producto.porcentajeDescuentoCantidad}%</span>`;
    }

    fila.innerHTML = `
      <td data-label="Producto">${producto.nombre}${indicadorDescuentoHtml}</td>
      <td data-label="Cant.">${producto.cantidad}</td>
      <td data-label="Subtotal">${formatearNumero(producto.subtotal)}</td>
      <td data-label="Acción">
        <button type="button" class="btn-eliminar" onclick="removerProducto(${index})">
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </td>
    `;
  });
  
  calcularDescuentos();
}

/**
 * Remueve un producto de la venta
 */
function removerProducto(indice) {
  const producto = productosEnVenta[indice];
  productosEnVenta.splice(indice, 1);
  renderizarTablaProductos();
  mostrarNotificacion(`🗑️ ${producto.nombre} eliminado`, "success");
}

/**
 * Obtiene el descuento por cantidad aplicable
 */
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
// CÁLCULOS Y FINALIZACIÓN DE VENTA
// ======================================================================

/**
 * Calcula descuentos por tipo de cliente
 */
function calcularDescuentos() {
  const tipoCliente = document.getElementById('tipoCliente').value;
  const totalSinDescuento = productosEnVenta.reduce((total, producto) => total + producto.subtotal, 0);
  const descuentoAplicable = configuracionDescuentos.find(desc => 
    desc.tipo === tipoCliente && totalSinDescuento >= desc.montoMinimo
  );
  
  const totalElement = document.getElementById('total-general');

  if (descuentoAplicable && totalSinDescuento > 0) {
    const montoDescuento = totalSinDescuento * (descuentoAplicable.porcentaje / 100);
    const totalConDescuento = totalSinDescuento - montoDescuento;
    const totalFinalRedondeado = redondearPrecioEspecial(totalConDescuento);
    
    totalElement.innerHTML = `
      <i class="fas fa-calculator"></i> 
      Total Venta: ${formatearNumero(totalFinalRedondeado)}
      <small style="display: block; font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8;">
        Descuento ${descuentoAplicable.porcentaje}% aplicado
      </small>
    `;
  } else {
    const totalFinalRedondeado = redondearPrecioEspecial(totalSinDescuento);
    totalElement.innerHTML = `<i class="fas fa-calculator"></i> Total Venta: ${formatearNumero(totalFinalRedondeado)}`;
  }
}

/**
 * Redondea precio según regla de negocio
 */
function redondearPrecioEspecial(numero) {
  if (typeof numero !== 'number' || isNaN(numero)) return 0;
  const base = Math.floor(numero / 100) * 100;
  const residuo = numero % 100;
  if (residuo === 0) return numero;
  return residuo > 50 ? base + 100 : base + 50;
}

/**
 * Maneja el envío del formulario
 */
function handleFormSubmit(event) {
  event.preventDefault();
  
  if (productosEnVenta.length === 0) {
    mostrarNotificacion("❌ Debe añadir al menos un producto", "error");
    return;
  }
  
  mostrarModalConfirmacion();
}

/**
 * Muestra el modal de confirmación
 */
function mostrarModalConfirmacion() {
  const modal = document.getElementById('modal-confirmacion');
  const resumen = document.getElementById('resumen-confirmacion');
  
  const datosVenta = obtenerDatosFormulario();
  const totalTexto = document.getElementById('total-general').textContent.replace(/Total Venta: /, '');
  
  resumen.innerHTML = crearResumenVenta(datosVenta, totalTexto);
  modal.style.display = 'block';
  
  // Enfocar botón de confirmar
  setTimeout(() => {
    document.getElementById('btn-confirmar-venta').focus();
  }, 100);
}

/**
 * Obtiene los datos del formulario
 */
function obtenerDatosFormulario() {
  const fecha = document.getElementById("fecha").value;
  const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  return {
    vendedor: document.getElementById("vendedor").value,
    fecha: fechaFormateada,
    tipoCliente: document.getElementById("tipoCliente").value,
    medioPago: document.getElementById("medioPago").value,
    observaciones: document.getElementById("observaciones").value
  };
}

/**
 * Crea el HTML del resumen de venta
 */
function crearResumenVenta(datos, total) {
  return `
    <div style="text-align: left; space-y: 0.75rem;">
      <p><strong><i class="fas fa-user"></i> Vendedor:</strong> ${datos.vendedor}</p>
      <p><strong><i class="fas fa-calendar"></i> Fecha:</strong> ${datos.fecha}</p>
      <p><strong><i class="fas fa-users"></i> Tipo Cliente:</strong> ${datos.tipoCliente}</p>
      <p><strong><i class="fas fa-credit-card"></i> Método de Pago:</strong> ${datos.medioPago}</p>
      <p><strong><i class="fas fa-boxes"></i> Productos:</strong> ${productosEnVenta.length}</p>
      ${datos.observaciones ? `<p><strong><i class="fas fa-sticky-note"></i> Observaciones:</strong> ${datos.observaciones}</p>` : ''}
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--primary-color); text-align: center;">
        <p style="font-size: 1.3rem; font-weight: bold; color: var(--primary-color);">
          <i class="fas fa-dollar-sign"></i> ${total}
        </p>
      </div>
    </div>
  `;
}

/**
 * Cierra el modal de confirmación
 */
function cerrarModalConfirmacion() {
  document.getElementById('modal-confirmacion').style.display = 'none';
}

/**
 * Confirma y envía la venta
 */
async function confirmarVenta() {
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
  const textoOriginal = boton.innerHTML;
  
  try {
    currentState = APP_STATES.SAVING;
    boton.disabled = true;
    boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: "follow",
      body: JSON.stringify({
        action: 'guardarVenta',
        datosVenta: datosVenta
      })
    });

    const respuesta = await response.json();
    
    if (respuesta.status === 'ok') {
      await manejarVentaExitosa(respuesta.idVenta);
    } else {
      throw new Error(respuesta.message || 'Error desconocido al guardar');
    }
    
  } catch (error) {
    console.error('Error al guardar venta:', error);
    mostrarNotificacion(`❌ Error al guardar: ${error.message}`, 'error');
  } finally {
    currentState = APP_STATES.READY;
    boton.disabled = false;
    boton.innerHTML = textoOriginal;
  }
}

/**
 * Maneja una venta guardada exitosamente
 */
async function manejarVentaExitosa(idVenta) {
  const urlDetalle = `detalle.html?id=${idVenta}`;
  const mensajeExito = `
    🎉 ¡Venta guardada exitosamente! 
    <a href="${urlDetalle}" target="_top" style="color: white; font-weight: bold; text-decoration: underline;">
      Ver Detalle
    </a>
  `;
  
  mostrarNotificacion(mensajeExito, 'success');
  
  // Resetear formulario
  await resetearFormulario();
  
  console.log(`✅ Venta guardada con ID: ${idVenta}`);
}

/**
 * Resetea el formulario después de una venta exitosa
 */
async function resetearFormulario() {
  document.getElementById("formVenta").reset();
  productosEnVenta = [];
  productoSeleccionado = null;
  
  renderizarTablaProductos();
  establecerFechaActual();
  limpiarCamposProducto();
  
  // Enfocar primer campo
  setTimeout(() => {
    document.getElementById("vendedor").focus();
  }, 100);
}

/**
 * Establece la fecha actual en el campo fecha
 */
function establecerFechaActual() {
  const fechaInput = document.getElementById("fecha");
  if (fechaInput) {
    const hoy = new Date();
    fechaInput.value = hoy.toISOString().split('T')[0];
    console.log("📅 Fecha establecida:", fechaInput.value);
  }
}