document.getElementById("btnImprimir").addEventListener("click", async () => {
  const texto = document.getElementById("inputTexto").value;
  const status = document.getElementById("status");

  if (!texto) {
    status.textContent = "Digite algo para imprimir.";
    return;
  }

  status.textContent = "Imprimindo...";

  const result = await window.api.printLabel(texto);

  status.textContent = result;
});
