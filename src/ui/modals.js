import {
  appDetailModal,
  editModal,
  notificationsModal,
  settingsModal,
  editModalTitle,
  appNameInput,
  appIconInput,
  loginInput,
  passwordInput,
  notificationDaysInput,
  fileChoiceModal,
  btnChooseExisting,
  btnCreateNew,
} from "./domElements.js";
import {
  passwordData,
  currentIndex,
  setCurrentIndex,
  notificationThresholdDays,
  addPasswordDataItem,
} from "../state.js";
import { getFormattedDate } from "../utils/dateUtils.js";
import { saveData } from "../core/dataManagement.js";
import { renderGrid } from "./render.js";
import { checkOldPasswords } from "../core/passwordLogic.js";
import { updateUnreadCount, renderNotifications } from "./notificationsUI.js";

export function closeDetailModal() {
  appDetailModal.classList.add("hidden");
}

export function openEditModal(item, index) {
  setCurrentIndex(index);

  if (item) {
    editModalTitle.textContent = "Оновити запис";
    appNameInput.value = item.appName;
    appIconInput.value = item.iconUrl || "";
    loginInput.value = item.login;
    passwordInput.value = item.password;
  } else {
    editModalTitle.textContent = "Новий запис";
    appNameInput.value = "";
    appIconInput.value = "";
    loginInput.value = "";
    passwordInput.value = "";
  }
  editModal.classList.remove("hidden");
}

export function closeEditModal() {
  editModal.classList.add("hidden");
}

export async function saveEdit() {
  const appName = appNameInput.value.trim();
  const iconUrl = appIconInput.value.trim();
  const login = loginInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!appName || !login || !pass) {
    notify.classList.add("is-visible");
    notify.innerHTML = "Назва, логін і пароль не можуть бути порожніми!";
    setTimeout(() => {
      notify.classList.remove("is-visible");
    }, 5000);
    return;
  }

  const nowStr = getFormattedDate();

  if (currentIndex >= 0) {
    passwordData[currentIndex].appName = appName;
    passwordData[currentIndex].iconUrl = iconUrl;
    passwordData[currentIndex].login = login;
    passwordData[currentIndex].password = pass;
    passwordData[currentIndex].lastUpdated = nowStr;
  } else {
    addPasswordDataItem({
      appName,
      iconUrl,
      login,
      password: pass,
      lastUpdated: nowStr,
    });
  }

  closeEditModal();
  renderGrid();
  await saveData();
  checkOldPasswords();
  updateUnreadCount();
}

export function editCurrentItem() {
  closeDetailModal();
  const item = passwordData[currentIndex];
  openEditModal(item, currentIndex);
}

export function openNotificationsModal() {
  notificationsModal.classList.remove("hidden");
  updateUnreadCount();
  renderNotifications();
}

export function closeNotificationsModal() {
  notificationsModal.classList.add("hidden");
}

export function openSettingsModal() {
  notificationDaysInput.value = notificationThresholdDays;
  settingsModal.classList.remove("hidden");
}

export function closeSettingsModal() {
  settingsModal.classList.add("hidden");
}

export function showFileChoiceDialog() {
  return new Promise((resolve) => {
    fileChoiceModal.classList.remove("hidden");

    const cleanup = () => {
      fileChoiceModal.classList.add("hidden");
      btnChooseExisting.removeEventListener("click", onExisting);
      btnCreateNew.removeEventListener("click", onCreate);
    };

    const onExisting = async () => {
      cleanup();
      const path = await window.api.pickExistingFile();
      resolve({ path, isNew: false });
    };

    const onCreate = async () => {
      cleanup();
      const path = await window.api.pickFileLocation();
      resolve({ path, isNew: true });
    };

    btnChooseExisting.addEventListener("click", onExisting);
    btnCreateNew.addEventListener("click", onCreate);
  });
}
