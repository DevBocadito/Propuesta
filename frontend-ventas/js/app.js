// Cambiar de vista
function mostrarVista(nombre) {
  document.querySelectorAll(".vista").forEach(v => v.classList.add("hidden"));
  document.getElementById("vista-" + nombre).classList.remove("hidden");

  // cerrar sidebar en móvil
  document.getElementById("sidebar").classList.remove("abierto");
}

// Sidebar toggle
document.getElementById("menu-toggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("abierto");
});

// Vista inicial
document.addEventListener("DOMContentLoaded", () => {
  mostrarVista("dashboard");
});
