// Elementos do DOM
const productCodeInput = document.getElementById("product-code");
const productNameInput = document.getElementById("product-name");
const productBatchInput = document.getElementById("product-batch");
const productionDateInput = document.getElementById("production-date");
const scanButton = document.getElementById("scan-btn");
const sendButton = document.getElementById("send-btn");
const resetButton = document.getElementById("reset-btn");
const deleteButton = document.getElementById("delete-btn");
const labelContent = document.getElementById("label-content");
const emptyPreview = document.getElementById("empty-preview");
const statusMessage = document.getElementById("status-message");
const previewCode = document.getElementById("preview-code");
const previewName = document.getElementById("preview-name");
const previewBatch = document.getElementById("preview-batch");
const previewDate = document.getElementById("preview-date");
const qrCodeElement = document.getElementById("qrcode");

// Estado da aplicação
let isScanning = false;
let qrCode = null;

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Define a data de hoje como padrão
  productionDateInput.valueAsDate = new Date();

  // Esconde o conteúdo da etiqueta inicialmente
  labelContent.style.display = "none";

  // Inicializa QR Code
  qrCode = new QRCode(qrCodeElement, {
    text: "EtiqScan",
    width: 128,
    height: 128,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
});

// Função para atualizar a visualização da etiqueta
function updateLabelPreview() {
  const code = productCodeInput.value.trim();
  const name = productNameInput.value.trim();
  const batch = productBatchInput.value.trim();
  const date = productionDateInput.value
    ? new Date(productionDateInput.value).toLocaleDateString()
    : "";

  // Verifica se há dados suficientes para mostrar a etiqueta
  if (code || name || batch) {
    // Atualiza os campos de visualização
    previewCode.textContent = code || "-";
    previewName.textContent = name || "-";
    previewBatch.textContent = batch || "-";
    previewDate.textContent = date || "-";

    // Atualiza o QR Code
    const qrData = JSON.stringify({
      code,
      name,
      batch,
      date: productionDateInput.value,
    });

    // Limpa o QR Code anterior e cria um novo
    qrCodeElement.innerHTML = "";
    qrCode = new QRCode(qrCodeElement, {
      text: qrData,
      width: 128,
      height: 128,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    // Mostra o conteúdo da etiqueta e esconde o estado vazio
    labelContent.style.display = "flex";
    emptyPreview.style.display = "none";
  } else {
    // Esconde o conteúdo da etiqueta e mostra o estado vazio
    labelContent.style.display = "none";
    emptyPreview.style.display = "flex";
  }
}

// Função para mostrar mensagens de status
function showStatusMessage(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = "status-message";

  if (type === "success") {
    statusMessage.classList.add("success-message");
  } else if (type === "error") {
    statusMessage.classList.add("error-message");
  }

  // Limpa a mensagem após 5 segundos
  setTimeout(() => {
    statusMessage.textContent = "";
    statusMessage.className = "status-message";
  }, 5000);
}

// Função para limpar todos os campos
function resetFields() {
  productCodeInput.value = "";
  productNameInput.value = "";
  productBatchInput.value = "";
  productionDateInput.valueAsDate = new Date();

  // Atualiza a visualização
  updateLabelPreview();

  // Foca no campo de código
  productCodeInput.focus();
}

// Função para ativar o modo de escaneamento
function activateScanMode() {
  isScanning = true;
  productCodeInput.value = "";
  productCodeInput.placeholder = "Aguardando leitura do QR Code...";
  productCodeInput.focus();
  productCodeInput.classList.add("scanning");
  showStatusMessage("Modo de leitura ativado. Escaneie o código QR.");

  // Desativa o botão de escaneamento
  scanButton.disabled = true;
}

// Função para desativar o modo de escaneamento
function deactivateScanMode() {
  isScanning = false;
  productCodeInput.placeholder = "Digite ou escaneie o código do produto";
  productCodeInput.classList.remove("scanning");

  // Reativa o botão de escaneamento
  scanButton.disabled = false;
}

// Função para enviar dados para impressão
async function sendToPrinter() {
  const labelData = {
    code: productCodeInput.value.trim(),
    name: productNameInput.value.trim(),
    batch: productBatchInput.value.trim(),
    date: productionDateInput.value,
  };

  // Verifica se há dados válidos para enviar
  if (!labelData.code) {
    showStatusMessage("Por favor, insira o código do produto.", "error");
    return;
  }

  try {
    // Chama a função exposta pelo preload.js
    const result = await window.labelAPI.sendToPrinter(labelData);

    if (result.success) {
      showStatusMessage(result.message, "success");
    } else {
      showStatusMessage(`Erro: ${result.message}`, "error");
    }
  } catch (error) {
    showStatusMessage(`Erro na comunicação: ${error.message}`, "error");
    console.error("Erro ao enviar para impressora:", error);
  }
}

// Detecta entrada automática do leitor de QR Code
// O leitor QR normalmente envia os dados rapidamente, seguidos de um Enter
let lastInputTime = 0;
let inputBuffer = "";
const QR_CODE_TIMEOUT = 100; // tempo em ms para considerar entrada rápida como sendo do leitor

productCodeInput.addEventListener("input", (e) => {
  const now = Date.now();

  // Se estiver no modo de escaneamento ou a entrada for rápida o suficiente
  if (
    isScanning ||
    (now - lastInputTime < QR_CODE_TIMEOUT && lastInputTime !== 0)
  ) {
    // Acumula caracteres no buffer
    inputBuffer += e.data || "";
  } else {
    // Reinicia o buffer se for digitação manual
    inputBuffer = e.data || "";
  }

  lastInputTime = now;
});

// Detecta quando o Enter é pressionado (comum em leitores de QR Code)
productCodeInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    if (isScanning) {
      // Processa o QR Code lido
      deactivateScanMode();
      showStatusMessage("Código escaneado com sucesso!", "success");

      // Atualiza visualização
      updateLabelPreview();

      // Move o foco para o próximo campo
      productNameInput.focus();
    } else if (Date.now() - lastInputTime < QR_CODE_TIMEOUT) {
      // Entrada rápida seguida de Enter = provável leitor QR
      showStatusMessage("Código detectado automaticamente!", "success");

      // Tenta extrair dados JSON do QR (se for um QR com dados estruturados)
      try {
        const qrData = JSON.parse(productCodeInput.value);

        // Preenche os campos se o JSON contiver as propriedades esperadas
        if (qrData.code) productCodeInput.value = qrData.code;
        if (qrData.name) productNameInput.value = qrData.name;
        if (qrData.batch) productBatchInput.value = qrData.batch;
        if (qrData.date) productionDateInput.value = qrData.date;
      } catch (error) {
        // Não é um JSON válido, manter apenas o código
        console.log(
          "QR Code não contém JSON válido, usando como código simples"
        );
      }

      // Atualiza visualização
      updateLabelPreview();
    }
  }
});

// Atualiza a visualização da etiqueta quando os dados são alterados
productCodeInput.addEventListener("input", updateLabelPreview);
productNameInput.addEventListener("input", updateLabelPreview);
productBatchInput.addEventListener("input", updateLabelPreview);
productionDateInput.addEventListener("change", updateLabelPreview);

// Event listeners para os botões
scanButton.addEventListener("click", activateScanMode);

sendButton.addEventListener("click", sendToPrinter);

resetButton.addEventListener("click", resetFields);

deleteButton.addEventListener("click", () => {
  // Esconde o conteúdo da etiqueta e mostra o estado vazio
  labelContent.style.display = "none";
  emptyPreview.style.display = "flex";
  showStatusMessage("Visualização da etiqueta removida.");
});
