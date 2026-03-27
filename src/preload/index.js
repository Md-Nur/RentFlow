import { contextBridge, ipcRenderer } from "electron";
import { exposeElectronAPI } from "@electron-toolkit/preload";

const api = {
    // Renters
    getAllRenters: () => ipcRenderer.invoke("renters:getAll"),
    addRenter: (renter) => ipcRenderer.invoke("renters:add", renter),
    updateRenter: (renter) => ipcRenderer.invoke("renters:update", renter),
    deleteRenter: (id) => ipcRenderer.invoke("renters:delete", id),

    // Billing
    saveBills: (data) => ipcRenderer.invoke("billing:saveBills", data),
    getBillingHistory: (month) => ipcRenderer.invoke("billing:getHistory", month),

    // Analytics
    getSummary: () => ipcRenderer.invoke("analytics:getSummary"),

    // Utils
    getFontData: () => ipcRenderer.invoke("billing:getFontData")
};

if (process.contextIsolated) {
    try {
        exposeElectronAPI();
        contextBridge.exposeInMainWorld("api", api);
    } catch (error) {
        console.error(error);
    }
} else {
    window.electron = electronAPI;
    window.api = api;
}
