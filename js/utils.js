/**
 * Formatea un número como moneda colombiana (COP).
 * @param {number | string} num El número a formatear.
 * @returns {string} El número formateado como "$ X.XXX".
 */
function formatearNumero(num) {
  if (num === null || num === undefined) return "$ 0";
  return "$ " + Number(num).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/**
 * Muestra una notificación temporal en la pantalla.
 * @param {string} message El mensaje a mostrar.
 * @param {string} type El tipo de notificación ('success' o 'error').
 */
function mostrarNotificacion(message, type) {
  const notificationArea = document.getElementById('notification-area');
  if (notificationArea) {
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.innerHTML = message;
    notificationArea.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 5000);
  }
}