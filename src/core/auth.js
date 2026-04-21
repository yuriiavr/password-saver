import {
  masterPasswordInput,
  loginContainer,
  mainContainer,
  loginError,
  oldMasterPasswordInput,
  newMasterPasswordInput,
  confirmNewMasterPasswordInput,
  changeMasterModal,
} from "../ui/domElements.js";
import { loadData, saveData } from "./dataManagement.js";
import { checkOldPasswords } from "./passwordLogic.js";
import { updateUnreadCount } from "../ui/notificationsUI.js";
import { setMasterPassword, setPasswordData } from "../state.js";
import { renderGrid, showNotification } from "../ui/render.js";

export function lockApp() {
  setMasterPassword("");
  setPasswordData([]);
  masterPasswordInput.value = "";
  loginError.classList.add("hidden");
  mainContainer.classList.add("hidden");
  loginContainer.classList.remove("hidden");
  masterPasswordInput.focus();
}

export async function handleLogin() {
  const currentMasterPassword = masterPasswordInput.value.trim();

  masterPasswordInput.classList.remove("shake");
  loginError.classList.add("hidden");

  if (!currentMasterPassword) {
    showNotification("Введіть майстер-пароль!");
    masterPasswordInput.classList.add("shake");
    setTimeout(() => masterPasswordInput.classList.remove("shake"), 500);
    return;
  }

  setMasterPassword(currentMasterPassword);

  try {
    await loadData();
    loginContainer.classList.add("hidden");
    mainContainer.classList.remove("hidden");
    checkOldPasswords();
    updateUnreadCount();
    renderGrid();
  } catch (err) {
    console.error("Помилка входу або завантаження даних:", err);

    setMasterPassword("");

    loginError.classList.remove("hidden");
    masterPasswordInput.classList.add("shake");

    masterPasswordInput.value = "";
    masterPasswordInput.focus();

    setTimeout(() => {
      masterPasswordInput.classList.remove("shake");
    }, 400);
  }
}

export function openChangeMasterPasswordModal() {
  oldMasterPasswordInput.value = "";
  newMasterPasswordInput.value = "";
  confirmNewMasterPasswordInput.value = "";
  changeMasterModal.classList.remove("hidden");
}

export function closeChangeMasterPasswordModal() {
  changeMasterModal.classList.add("hidden");
}

export async function saveNewMasterPassword() {
  const oldPass = oldMasterPasswordInput.value.trim();
  const newPass = newMasterPasswordInput.value.trim();
  const confirmNewPass = confirmNewMasterPasswordInput.value.trim();

  if (!oldPass || !newPass || !confirmNewPass) {
    showNotification("Будь ласка, заповніть всі поля!");
    return;
  }

  if (newPass !== confirmNewPass) {
    showNotification("Новий пароль і підтвердження не співпадають!");
    return;
  }

  try {
    await window.api.loadEncryptedData(oldPass);
  } catch (err) {
    showNotification("Поточний пароль введено невірно!");
    return;
  }

  setMasterPassword(newPass);
  try {
    await saveData();
    showNotification("Майстер-пароль змінено успішно!");
    changeMasterModal.classList.add("hidden");
  } catch (err) {
    console.error("Помилка зміни майстер-пароля:", err);
    showNotification("Не вдалося змінити майстер-пароль!");
  }
}