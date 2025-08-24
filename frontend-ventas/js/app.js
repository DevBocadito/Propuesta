function mostrarVista(nombre) {
  document.querySelectorAll(".vista").forEach(v => v.classList.add("hidden"));
  document.getElementById("vista-" + nombre).classList.remove("hidden");
  document.getElementById("sidebar").classList.remove("abierto");
}

document.getElementById("menu-toggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("abierto");
});

document.addEventListener("DOMContentLoaded", () => {
  mostrarVista("dashboard");
});
