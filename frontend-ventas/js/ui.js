function mostrarMensaje(msg, tipo="info") {
  const colores = {
    info: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700"
  };
  const div = document.createElement("div");
  div.className = `p-2 rounded mb-2 ${colores[tipo]}`;
  div.innerText = msg;
  document.body.prepend(div);
  setTimeout(() => div.remove(), 3000);
}
