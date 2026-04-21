import {
    addAppBtn, closeDetailBtn, showHideBtn, copyBtn, editBtn,
    saveEditBtn, cancelEditBtn, notificationsBtn, closeNotificationsBtn,
    openSettingsBtn, saveSettingsBtn, cancelSettingsBtn, notify,
    loginBtn, changeMasterBtn, cancelMasterBtn, saveMasterBtn,
    searchInput, passwordInput,
    hotkeyInput
} from './ui/domElements.js';

import { openEditModal, closeDetailModal,
         editCurrentItem, saveEdit, closeEditModal,
         openNotificationsModal, closeNotificationsModal,
         openSettingsModal, closeSettingsModal
       } from './ui/modals.js';
import { updateUnreadCount } from './ui/notificationsUI.js';

import { togglePasswordVisibility, renderGrid } from './ui/render.js';

import { notifications, setNotifications } from './state.js';
import { handleLogin, lockApp, openChangeMasterPasswordModal, closeChangeMasterPasswordModal, saveNewMasterPassword } from './core/auth.js';
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

    if (hotkeyInput) {
        hotkeyInput.addEventListener("keydown", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const keys = [];
            if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl');
            if (e.altKey) keys.push('Alt');
            if (e.shiftKey) keys.push('Shift');

            const forbiddenKeys = ['Control', 'Alt', 'Shift', 'Meta'];
            if (!forbiddenKeys.includes(e.key)) {
                keys.push(e.key.toUpperCase());
            }

            if (keys.length > 0) {
                hotkeyInput.value = keys.join('+');
            }
        });
    }

    const notificationList = document.getElementById("notificationList");
    if (notificationList) {
        notificationList.addEventListener("click", (e) => {
            if (e.target.classList.contains("close-notif-item")) {
                const li = e.target.closest("li");
                const entryId = li.dataset.id;
                const threshold = li.dataset.threshold;
                
                saveDismissedNotification(entryId, threshold);

                const updatedNotifications = notifications.filter(n => n.id !== entryId);
                setNotifications(updatedNotifications);

                li.remove();
                updateUnreadCount();
            }
        });
    }

    loginBtn.addEventListener("click", handleLogin);

    const masterPasswordInput = document.getElementById("masterPasswordInput");
    if (masterPasswordInput) {
        masterPasswordInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleLogin();
        });
    }

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
            lockApp();
            notify.classList.add('is-visible');
            notify.innerHTML = "Файл змінено. Введіть майстер-пароль для нового файлу.";
            setTimeout(() => notify.classList.remove('is-visible'), 6000);
        } else {
            notify.classList.add('is-visible');
            notify.innerHTML = "Вибір скасовано";
            setTimeout(() => notify.classList.remove('is-visible'), 3000);
        }
    });

    const changeFileOnLoginBtn = document.getElementById("changeFileOnLoginBtn");
    if (changeFileOnLoginBtn) {
        changeFileOnLoginBtn.addEventListener("click", async () => {
            const newFilePath = await window.api.pickExistingFile();
            if (newFilePath) {
                window.localStorage.setItem("dataFilePath", newFilePath);
                await window.api.setFilePath(newFilePath);
                notify.classList.add('is-visible');
                notify.innerHTML = "Файл вибрано. Тепер введіть майстер-пароль.";
                setTimeout(() => notify.classList.remove('is-visible'), 4000);
                masterPasswordInput.focus();
            }
        });
    }
}

function saveDismissedNotification(id, threshold) {
    const dismissed = JSON.parse(localStorage.getItem("dismissedNotifications") || "{}");
    dismissed[id] = parseInt(threshold);
    localStorage.setItem("dismissedNotifications", JSON.stringify(dismissed));
}