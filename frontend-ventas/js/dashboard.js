document.addEventListener("DOMContentLoaded", () => {
  // Datos de prueba
  document.getElementById("ventasHoy").innerText = "5";
  document.getElementById("stockBajo").innerText = "2";
  document.getElementById("clientes").innerText = "12";

  // Gráfico con datos mock
  const ctx = document.getElementById("ventasChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      datasets: [{
        label: "Ventas",
        data: [3, 7, 4, 6, 8, 5, 9],
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.2)"
      }]
    }
  });
});
