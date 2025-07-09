import {
  masterPassword,
  passwordData,
  setPasswordData,
  currentIndex,
} from "../state.js";
import { loginError } from "../ui/domElements.js";
import { getFormattedDate } from "../utils/dateUtils.js";
import { showNotification } from "../ui/render.js";

export async function loadData() {
  try {
    const loadedData = await window.api.loadEncryptedData(masterPassword);
    loadedData.forEach((item) => {
      if (!item.lastUpdated) {
        item.lastUpdated = getFormattedDate();
      }
      if (item.createdAt) {
        delete item.createdAt;
      }
    });
    setPasswordData(loadedData);
  } catch (err) {
    console.error("Помилка завантаження даних:", err);
    loginError.classList.remove("hidden");
    throw err;
  }
}

export async function saveData() {
  try {
    await window.api.saveEncryptedData(masterPassword, passwordData);
  } catch (err) {
    console.error("Помилка збереження даних:", err);
    notify.classList.add("is-visible");
    notify.innerHTML = "Не вдалося зберегти дані!";
    setTimeout(() => {
      notify.classList.remove("is-visible");
    }, 5000);
    throw err;
  }
}

export function copyCurrentPassword() {
  const item = passwordData[currentIndex];
  if (!item) return;

  navigator.clipboard
    .writeText(item.password)
    .then(() => {
      showNotification("Пароль скопійовано!");
    })
    .catch((err) => {
      console.error("Не вдалося скопіювати пароль: ", err);
      showNotification("Не вдалося скопіювати пароль.");
    });
}
