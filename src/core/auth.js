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
import { setMasterPassword } from "../state.js";
import { renderGrid } from "../ui/render.js";

export async function handleLogin() {
  const currentMasterPassword = masterPasswordInput.value.trim();
  if (!currentMasterPassword) {
    notify.classList.add("is-visible");
    notify.innerHTML = "Введіть майстер-пароль!";
    setTimeout(() => {
      notify.classList.remove("is-visible");
    }, 5000);
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
    loginError.classList.remove("hidden");
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
    notify.classList.add("is-visible");
    notify.innerHTML = "Будь ласка, заповніть всі поля!";
    setTimeout(() => {
      notify.classList.remove("is-visible");
    }, 5000);
    return;
  }

  if (newPass !== confirmNewPass) {
    notify.classList.add("is-visible");
    notify.innerHTML = "Новий пароль і його підтвердження не співпадають!";
    setTimeout(() => {
      notify.classList.remove("is-visible");
    }, 5000);
    return;
  }

  try {
    await window.api.loadEncryptedData(oldPass);
  } catch (err) {
    notify.classList.add("is-visible");
    notify.innerHTML = "Поточний пароль введено невірно!";
    setTimeout(() => {
      notify.classList.remove("is-visible");
    }, 5000);
    return;
  }

  setMasterPassword(newPass);
  try {
    await saveData();
    notify.classList.add("is-visible");
    notify.innerHTML = "Майстер-пароль змінено успішно!";
    setTimeout(() => {
      notify.classList.remove("is-visible");
    }, 5000);
    changeMasterModal.classList.add("hidden");
  } catch (err) {
    console.error("Помилка зміни майстер-пароля:", err);
    notify.classList.add("is-visible");
    notify.innerHTML = "Не вдалося змінити майстер-пароль!";
    setTimeout(() => {
      notify.classList.remove("is-visible");
    }, 5000);
  }
}
