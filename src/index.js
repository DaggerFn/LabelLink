const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// Função para criar a janela principal
function createWindow() {
  // Cria a janela do navegador
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "assets/icon.png"),
  });

  // Carrega o arquivo HTML principal
  mainWindow.loadFile("index.html");

  // Descomente para abrir o DevTools automaticamente
  // mainWindow.webContents.openDevTools();
}

// Quando o Electron terminar a inicialização, crie a janela
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // No macOS, é comum recriar uma janela no app quando o
    // ícone do dock é clicado e não há outras janelas abertas.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Sair quando todas as janelas estiverem fechadas, exceto no macOS
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// Handler para simulação de impressão (chamada fictícia)
ipcMain.handle("print-label", async (event, labelData) => {
  console.log("Enviando dados para impressora Zebra:", labelData);
  // Aqui seria implementada a lógica real de comunicação com a impressora
  return {
    success: true,
    message: "Etiqueta enviada para impressão (simulação)",
  };
});
