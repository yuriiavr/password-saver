import {
  notificationThresholdDays,
  setNotificationThresholdDays,
} from "../state.js";
import { notificationDaysInput } from "../ui/domElements.js";
import { showNotification } from "../ui/render.js";
import { checkOldPasswords } from "./passwordLogic.js";
import { updateUnreadCount } from "../ui/notificationsUI.js";
import { closeSettingsModal } from "../ui/modals.js";

export function loadSettings() {
  const storedDays = localStorage.getItem("notificationThresholdDays");
  if (storedDays !== null) {
    let parsedDays = parseInt(storedDays, 10);
    if (isNaN(parsedDays) || parsedDays < 1) {
      parsedDays = 60;
    }
    setNotificationThresholdDays(parsedDays);
  }
  notificationDaysInput.value = notificationThresholdDays;
}

export function saveSettings() {
  const newDays = parseInt(notificationDaysInput.value, 10);
  if (!isNaN(newDays) && newDays >= 1) {
    setNotificationThresholdDays(newDays);
    localStorage.setItem("notificationThresholdDays", newDays);
    showNotification("Налаштування збережено");
    checkOldPasswords();
    updateUnreadCount();
  } else {
    notify.classList.add("is-visible");
    notify.innerHTML = "Будь ласка, введіть дійсне число днів (більше 0).";
    setTimeout(() => {
      notify.classList.remove("is-visible");
    }, 5000);
    notificationDaysInput.value = notificationThresholdDays;
  }
  closeSettingsModal();
}
