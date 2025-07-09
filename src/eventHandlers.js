import {
    addAppBtn, closeDetailBtn, showHideBtn, copyBtn, editBtn,
    saveEditBtn, cancelEditBtn, notificationsBtn, closeNotificationsBtn,
    openSettingsBtn, saveSettingsBtn, cancelSettingsBtn, notify,
    loginBtn, changeMasterBtn, cancelMasterBtn, saveMasterBtn,
    searchInput, passwordInput
} from './ui/domElements.js';

import { openEditModal, closeDetailModal,
         editCurrentItem, saveEdit, closeEditModal,
         openNotificationsModal, closeNotificationsModal,
         openSettingsModal, closeSettingsModal
       } from './ui/modals.js'; 

import { togglePasswordVisibility, renderGrid } from './ui/render.js';

import { handleLogin, openChangeMasterPasswordModal, closeChangeMasterPasswordModal, saveNewMasterPassword } from './core/auth.js';
import { saveSettings } from './core/settings.js';
import { generateRandomPassword } from './utils/passwordGenerator.js';
import { copyCurrentPassword, loadData } from './core/dataManagement.js';


export function setupEventHandlers() {
    addAppBtn.addEventListener("click", () => openEditModal(null, -1));
    closeDetailBtn.addEventListener("click", closeDetailModal);
    showHideBtn.addEventListener("click", togglePasswordVisibility); 
    copyBtn.addEventListener("click", copyCurrentPassword);
    editBtn.addEventListener("click", editCurrentItem);

    saveEditBtn.addEventListener("click", saveEdit);
    cancelEditBtn.addEventListener("click", closeEditModal);

    notificationsBtn.addEventListener("click", openNotificationsModal);
    closeNotificationsBtn.addEventListener("click", closeNotificationsModal);
    notify.addEventListener("click", () => notify.classList.remove("is-visible"));

    openSettingsBtn.addEventListener("click", openSettingsModal);
    saveSettingsBtn.addEventListener("click", saveSettings);
    cancelSettingsBtn.addEventListener("click", closeSettingsModal);

    loginBtn.addEventListener("click", handleLogin);
    changeMasterBtn.addEventListener("click", openChangeMasterPasswordModal);
    cancelMasterBtn.addEventListener("click", closeChangeMasterPasswordModal);
    saveMasterBtn.addEventListener("click", saveNewMasterPassword);

    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase();
        renderGrid(searchTerm);
    });

    document.getElementById("minimizeBtn").addEventListener("click", () => {
        window.api.minimizeWindow();
    });
    document.getElementById("maximizeBtn").addEventListener("click", () => {
        window.api.maximizeWindow();
    });
    document.getElementById("closeBtn").addEventListener("click", () => {
        window.api.closeWindow();
    });

    document.getElementById("generatePasswordBtn").addEventListener("click", () => {
        const newPassword = generateRandomPassword(16);
        passwordInput.value = newPassword;
    });

    document.getElementById("changeFileBtn").addEventListener("click", async () => {
        const newFilePath = await window.api.pickExistingFile();
        if (newFilePath) {
            window.localStorage.setItem("dataFilePath", newFilePath);
            await window.api.setFilePath(newFilePath);
            await loadData();
            notify.classList.add('is-visible')
            notify.innerHTML = "Файл змінено успішно!"
            setTimeout(() => {
                notify.classList.remove('is-visible')
            }, 5000)
        } else {
            notify.classList.add('is-visible')
            notify.innerHTML = "Вибір скасовано"
            setTimeout(() => {
                notify.classList.remove('is-visible')
            }, 5000)
        }
    });
}