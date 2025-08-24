// ======================================================================
// UTILIDADES DE FORMATEO
// ======================================================================

/**
 * Formatea un número como moneda colombiana (COP)
 * @param {number | string | null | undefined} num El número a formatear
 * @returns {string} El número formateado como "$ X.XXX"
 */
function formatearNumero(num) {
  if (num === null || num === undefined || num === '') return "$ 0";
  
  const numero = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numero)) return "$ 0";
  
  return "$ " + numero.toLocaleString('es-CO', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });
}

/**
 * Formatea un número sin el símbolo de peso
 * @param {number | string | null | undefined} num El número a formatear
 * @returns {string} El número formateado como "X.XXX"
 */
function formatearNumeroSinSimbolo(num) {
  if (num === null || num === undefined || num === '') return "0";
  
  const numero = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numero)) return "0";
  
  return numero.toLocaleString('es-CO', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });
}

/**
 * Parsea un string formateado a número
 * @param {string} str String con formato de moneda
 * @returns {number} Número parseado
 */
function parsearNumero(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[$\s.]/g, '').replace(',', '.')) || 0;
}

/**
 * Formatea porcentaje
 * @param {number} num Número decimal (0.15 = 15%)
 * @returns {string} Porcentaje formateado
 */
function formatearPorcentaje(num) {
  if (num === null || num === undefined || isNaN(num)) return "0%";
  return `${(num * 100).toFixed(1)}%`;
}

// ======================================================================
// SISTEMA DE NOTIFICACIONES MEJORADO
// ======================================================================

const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.SUCCESS]: 'fas fa-check-circle',
  [NOTIFICATION_TYPES.ERROR]: 'fas fa-exclamation-circle',
  [NOTIFICATION_TYPES.WARNING]: 'fas fa-exclamation-triangle',
  [NOTIFICATION_TYPES.INFO]: 'fas fa-info-circle'
};

/**
 * Muestra una notificación mejorada
 * @param {string} message El mensaje a mostrar
 * @param {string} type Tipo de notificación ('success', 'error', 'warning', 'info')
 * @param {number} duration Duración en ms (por defecto 5000)
 * @param {boolean} autoClose Si se debe cerrar automáticamente
 */
function mostrarNotificacion(message, type = 'info', duration = 5000, autoClose = true) {
  const notificationArea = document.getElementById('notification-area');
  
  if (!notificationArea) {
    console.warn('⚠️ Área de notificaciones no encontrada');
    console.log(`${type.toUpperCase()}: ${message}`);
    return;
  }

  const notification = crearElementoNotificacion(message, type);
  
  // Añadir con animación
  notificationArea.appendChild(notification);
  
  // Trigger animación
  requestAnimationFrame(() => {
    notification.classList.add('show');
  });

  // Auto-cerrar si está habilitado
  if (autoClose) {
    setTimeout(() => {
      cerrarNotificacion(notification);
    }, duration);
  }
  
  // Log para desarrollo
  console.log(`🔔 ${type.toUpperCase()}: ${message}`);
  
  return notification;
}

/**
 * Crea el elemento HTML de la notificación
 * @param {string} message Mensaje
 * @param {string} type Tipo de notificación
 * @returns {HTMLElement} Elemento de notificación
 */
function crearElementoNotificacion(message, type) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  const icon = NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.info;
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="${icon}"></i>
      <span class="notification-message">${message}</span>
    </div>
    <button class="notification-close" onclick="cerrarNotificacion(this.parentElement)">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Añadir evento de click para cerrar
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cerrarNotificacion(notification);
  });
  
  return notification;
}

/**
 * Cierra una notificación específica
 * @param {HTMLElement} notification Elemento de notificación
 */
function cerrarNotificacion(notification) {
  if (!notification || !notification.parentElement) return;
  
  notification.classList.add('closing');
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.parentElement.removeChild(notification);
    }
  }, 300);
}

/**
 * Muestra notificación de éxito
 * @param {string} message Mensaje
 */
function mostrarExito(message) {
  return mostrarNotificacion(message, NOTIFICATION_TYPES.SUCCESS);
}

/**
 * Muestra notificación de error
 * @param {string} message Mensaje
 */
function mostrarError(message) {
  return mostrarNotificacion(message, NOTIFICATION_TYPES.ERROR, 7000);
}

/**
 * Muestra notificación de advertencia
 * @param {string} message Mensaje
 */
function mostrarAdvertencia(message) {
  return mostrarNotificación(message, NOTIFICATION_TYPES.WARNING, 6000);
}

/**
 * Muestra notificación informativa
 * @param {string} message Mensaje
 */
function mostrarInfo(message) {
  return mostrarNotificacion(message, NOTIFICATION_TYPES.INFO, 4000);
}

// ======================================================================
// UTILIDADES DE FECHA
// ======================================================================

/**
 * Formatea una fecha para mostrar
 * @param {Date|string} fecha Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
  if (!fecha) return 'N/A';
  
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  
  if (isNaN(date.getTime())) return 'Fecha inválida';
  
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
}

/**
 * Formatea una fecha con hora
 * @param {Date|string} fecha Fecha a formatear
 * @returns {string} Fecha y hora formateada
 */
function formatearFechaHora(fecha) {
  if (!fecha) return 'N/A';
  
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  
  if (isNaN(date.getTime())) return 'Fecha inválida';
  
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 * @returns {string} Fecha actual
 */
function obtenerFechaHoy() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calcula diferencia de días entre fechas
 * @param {Date|string} fecha1 Primera fecha
 * @param {Date|string} fecha2 Segunda fecha
 * @returns {number} Diferencia en días
 */
function diferenciaEnDias(fecha1, fecha2) {
  const date1 = fecha1 instanceof Date ? fecha1 : new Date(fecha1);
  const date2 = fecha2 instanceof Date ? fecha2 : new Date(fecha2);
  
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ======================================================================
// UTILIDADES DE VALIDACIÓN
// ======================================================================

/**
 * Valida si un email es válido
 * @param {string} email Email a validar
 * @returns {boolean} True si es válido
 */
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida si un teléfono colombiano es válido
 * @param {string} telefono Teléfono a validar
 * @returns {boolean} True si es válido
 */
function validarTelefono(telefono) {
  const regex = /^(\+57|57)?[0-9]{10}$/;
  return regex.test(telefono.replace(/\s/g, ''));
}

/**
 * Valida si un texto no está vacío
 * @param {string} texto Texto a validar
 * @returns {boolean} True si no está vacío
 */
function validarTextoNoVacio(texto) {
  return texto && typeof texto === 'string' && texto.trim().length > 0;
}

/**
 * Valida si un número está en un rango
 * @param {number} numero Número a validar
 * @param {number} min Valor mínimo
 * @param {number} max Valor máximo
 * @returns {boolean} True si está en el rango
 */
function validarRango(numero, min, max) {
  return typeof numero === 'number' && numero >= min && numero <= max;
}

// ======================================================================
// UTILIDADES DOM
// ======================================================================

/**
 * Busca un elemento por ID con manejo de errores
 * @param {string} id ID del elemento
 * @param {boolean} requerido Si es requerido (lanza error si no existe)
 * @returns {HTMLElement|null} Elemento encontrado o null
 */
function obtenerElemento(id, requerido = false) {
  const elemento = document.getElementById(id);
  
  if (!elemento && requerido) {
    throw new Error(`Elemento requerido con ID '${id}' no encontrado`);
  }
  
  return elemento;
}

/**
 * Obtiene el valor de un input con validación
 * @param {string} id ID del input
 * @param {*} valorPorDefecto Valor por defecto si está vacío
 * @returns {string} Valor del input
 */
function obtenerValorInput(id, valorPorDefecto = '') {
  const elemento = obtenerElemento(id);
  return elemento ? (elemento.value || valorPorDefecto) : valorPorDefecto;
}

/**
 * Establece el valor de un input de forma segura
 * @param {string} id ID del input
 * @param {*} valor Valor a establecer
 */
function establecerValorInput(id, valor) {
  const elemento = obtenerElemento(id);
  if (elemento) {
    elemento.value = valor || '';
  }
}

/**
 * Enfoca un elemento de forma segura
 * @param {string} id ID del elemento
 * @param {number} delay Retraso en ms
 */
function enfocarElemento(id, delay = 0) {
  setTimeout(() => {
    const elemento = obtenerElemento(id);
    if (elemento && typeof elemento.focus === 'function') {
      elemento.focus();
    }
  }, delay);
}

/**
 * Deshabilita/habilita un elemento
 * @param {string} id ID del elemento
 * @param {boolean} deshabilitado True para deshabilitar
 */
function toggleElemento(id, deshabilitado) {
  const elemento = obtenerElemento(id);
  if (elemento) {
    elemento.disabled = deshabilitado;
  }
}

// ======================================================================
// UTILIDADES DE ALMACENAMIENTO LOCAL
// ======================================================================

/**
 * Guarda datos en localStorage de forma segura
 * @param {string} clave Clave de almacenamiento
 * @param {*} datos Datos a guardar
 */
function guardarLocal(clave, datos) {
  try {
    localStorage.setItem(clave, JSON.stringify(datos));
  } catch (error) {
    console.warn('No se pudo guardar en localStorage:', error);
  }
}

/**
 * Carga datos de localStorage de forma segura
 * @param {string} clave Clave de almacenamiento
 * @param {*} valorPorDefecto Valor por defecto si no existe
 * @returns {*} Datos cargados o valor por defecto
 */
function cargarLocal(clave, valorPorDefecto = null) {
  try {
    const datos = localStorage.getItem(clave);
    return datos ? JSON.parse(datos) : valorPorDefecto;
  } catch (error) {
    console.warn('No se pudo cargar de localStorage:', error);
    return valorPorDefecto;
  }
}

/**
 * Elimina datos de localStorage
 * @param {string} clave Clave a eliminar
 */
function eliminarLocal(clave) {
  try {
    localStorage.removeItem(clave);
  } catch (error) {
    console.warn('No se pudo eliminar de localStorage:', error);
  }
}

// ======================================================================
// UTILIDADES DE PERFORMANCE
// ======================================================================

/**
 * Función debounce para limitar llamadas
 * @param {Function} func Función a ejecutar
 * @param {number} delay Retraso en ms
 * @returns {Function} Función con debounce
 */
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Función throttle para limitar frecuencia
 * @param {Function} func Función a ejecutar
 * @param {number} limit Límite en ms
 * @returns {Function} Función con throttle
 */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ======================================================================
// UTILIDADES DE ARRAYS Y OBJETOS
// ======================================================================

/**
 * Busca en un array de objetos por propiedad
 * @param {Array} array Array donde buscar
 * @param {string} propiedad Propiedad a comparar
 * @param {*} valor Valor a buscar
 * @returns {*} Objeto encontrado o null
 */
function buscarEnArray(array, propiedad, valor) {
  if (!Array.isArray(array)) return null;
  return array.find(item => item[propiedad] === valor) || null;
}

/**
 * Agrupa un array de objetos por propiedad
 * @param {Array} array Array a agrupar
 * @param {string} propiedad Propiedad por la que agrupar
 * @returns {Object} Objeto agrupado
 */
function agruparPor(array, propiedad) {
  if (!Array.isArray(array)) return {};
  
  return array.reduce((grupos, item) => {
    const clave = item[propiedad];
    if (!grupos[clave]) {
      grupos[clave] = [];
    }
    grupos[clave].push(item);
    return grupos;
  }, {});
}

/**
 * Suma valores de una propiedad en un array de objetos
 * @param {Array} array Array de objetos
 * @param {string} propiedad Propiedad numérica a sumar
 * @returns {number} Suma total
 */
function sumarPropiedad(array, propiedad) {
  if (!Array.isArray(array)) return 0;
  
  return array.reduce((total, item) => {
    const valor = parseFloat(item[propiedad]) || 0;
    return total + valor;
  }, 0);
}

// ======================================================================
// UTILIDADES DE DESARROLLO
// ======================================================================

/**
 * Log con formato para desarrollo
 * @param {string} mensaje Mensaje a mostrar
 * @param {string} tipo Tipo de log
 * @param {*} datos Datos adicionales
 */
function logDev(mensaje, tipo = 'info', datos = null) {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🐛'
    };
    
    console.log(`${emoji[tipo] || 'ℹ️'} ${mensaje}`, datos || '');
  }
}

/**
 * Mide tiempo de ejecución de una función
 * @param {Function} func Función a medir
 * @param {string} nombre Nombre para identificar
 * @returns {*} Resultado de la función
 */
function medirTiempo(func, nombre = 'Función') {
  const inicio = performance.now();
  const resultado = func();
  const fin = performance.now();
  
  logDev(`${nombre} ejecutada en ${(fin - inicio).toFixed(2)}ms`, 'debug');
  return resultado;
}

// ======================================================================
// EXPORTAR PARA COMPATIBILIDAD (SI SE USA MODULES)
// ======================================================================

// Si el entorno soporta módulos ES6, exportar funciones
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatearNumero,
    formatearNumeroSinSimbolo,
    parsearNumero,
    formatearPorcentaje,
    mostrarNotificacion,
    mostrarExito,
    mostrarError,
    mostrarAdvertencia,
    mostrarInfo,
    formatearFecha,
    formatearFechaHora,
    obtenerFechaHoy,
    validarEmail,
    validarTelefono,
    validarTextoNoVacio,
    validarRango,
    obtenerElemento,
    obtenerValorInput,
    establecerValorInput,
    enfocarElemento,
    toggleElemento,
    debounce,
    throttle,
    buscarEnArray,
    agruparPor,
    sumarPropiedad,
    logDev,
    medirTiempo
  };
}