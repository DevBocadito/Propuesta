// Cargar componentes (navbar, sidebar, vistas)
function loadComponent(targetId, url) {
  fetch(url)
    .then(res => res.text())
    .then(html => document.getElementById(targetId).innerHTML = html);
}

// Cargar vistas dinámicas
function navigateTo(view) {
  fetch(`components/${view}.html`)
    .then(res => res.text())
    .then(html => {
      document.getElementById("app-content").innerHTML = html;
      console.log(`Vista cargada: ${view}`);
      // Aquí luego inicializamos la lógica del módulo JS correspondiente
    })
    .catch(err => {
      document.getElementById("app-content").innerHTML = `<p>Error al cargar vista: ${err.message}</p>`;
    });
}
