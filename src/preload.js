// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require("electron");

// Expondo funções seguras para o processo de renderização
contextBridge.exposeInMainWorld("labelAPI", {
  // Função que será implementada no futuro para enviar dados à impressora
  sendToPrinter: async (data) => {
    try {
      // Chamada simulada para o processo principal
      const result = await ipcRenderer.invoke("print-label", data);
      return result;
    } catch (error) {
      console.error("Erro ao enviar para impressora:", error);
      return { success: false, message: error.message };
    }
  },
});
