let passwordData = [];

// Список повідомлень (notifications). Кожен об’єкт має { message, isRead }.
let notifications = [];

let currentIndex = -1;
let isPasswordVisible = false;

let masterPassword = "";
let notificationThresholdDays = 60; // ЗНАЧЕННЯ ЗА ЗАМОВЧУВАННЯМ: 60 днів

const appGrid = document.getElementById("appGrid");
const addAppBtn = document.getElementById("addAppBtn");

const appDetailModal = document.getElementById("appDetailModal");
const detailTitle = document.getElementById("detailTitle");
const detailIcon = document.getElementById("detailIcon");
const detailLogin = document.getElementById("detailLogin");
const detailPassword = document.getElementById("detailPassword");
const detailUpdated = document.getElementById("detailUpdated");

const closeDetailBtn = document.getElementById("closeDetailBtn");
const showHideBtn = document.getElementById("showHideBtn");
const copyBtn = document.getElementById("copyBtn");
const editBtn = document.getElementById("editBtn");

const editModal = document.getElementById("editModal");
const editModalTitle = document.getElementById("editModalTitle");
const appNameInput = document.getElementById("appNameInput");
const appIconInput = document.getElementById("appIconInput");
const loginInput = document.getElementById("loginInput");
const passwordInput = document.getElementById("passwordInput");

const saveEditBtn = document.getElementById("saveEditBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const notificationsBtn = document.getElementById("notificationsBtn");
const notifCountSpan = document.getElementById("notifCount");
const notificationsModal = document.getElementById("notificationsModal");
const notificationList = document.getElementById("notificationList");
const closeNotificationsBtn = document.getElementById("closeNotificationsBtn");
const notify = document.getElementById("notify");

// НОВІ ЕЛЕМЕНТИ НАЛАШТУВАНЬ
const openSettingsBtn = document.getElementById("openSettingsBtn");
const settingsModal = document.getElementById("settingsModal");
const notificationDaysInput = document.getElementById("notificationDaysInput");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const cancelSettingsBtn = document.getElementById("cancelSettingsBtn");


// Закриття повідомлень
notify.addEventListener("click", function () {
  notify.classList.remove("is-visible");
});

/* --------------------------
   ФУНКЦІЇ ДЛЯ РОБОТИ З ІНТЕРФЕЙСОМ
-------------------------- */

// Функція для форматування дати у "ДД.ММ.РРРР"
function getFormattedDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}

function renderGrid(searchTerm = "") {
  appGrid.innerHTML = "";

  passwordData
    .filter((item) => item.appName.toLowerCase().includes(searchTerm))
    .forEach((item, index) => {
      const card = document.createElement("div");
      card.classList.add("app-card");

      if (item.iconUrl) {
        const img = document.createElement("img");
        img.src = item.iconUrl;
        card.appendChild(img);
      }

      const title = document.createElement("div");
      title.classList.add("app-title");
      title.textContent = item.appName;
      card.appendChild(title);

      card.addEventListener("click", () => {
        openDetailModal(index);
      });

      appGrid.appendChild(card);
    });
}

/**
 * Відкрити модалку деталей
 */
function openDetailModal(index) {
  const item = passwordData[index];
  currentIndex = index;
  isPasswordVisible = false;

  detailTitle.textContent = item.appName;
  if (item.iconUrl) {
    detailIcon.src = item.iconUrl;
    detailIcon.style.display = "block";
  } else {
    // якщо іконки немає
    detailIcon.src = "";
    detailIcon.style.display = "none";
  }

  detailLogin.textContent = item.login;
  detailPassword.textContent = "********"; // спочатку приховано
  detailUpdated.textContent = item.lastUpdated || "";
  appDetailModal.classList.remove("hidden");
}

function closeDetailModal() {
  appDetailModal.classList.add("hidden");
}

/**
 * Показати/приховати пароль у вікні деталей
 */
function togglePasswordVisibility() {
  const item = passwordData[currentIndex];
  if (!item) return;

  isPasswordVisible = !isPasswordVisible;
  detailPassword.textContent = isPasswordVisible ? item.password : "********";
}

/**
 * Копіювати поточний пароль у буфер
 */
function copyCurrentPassword() {
  const item = passwordData[currentIndex];
  if (!item) return;

  navigator.clipboard
    .writeText(item.password)
    .then(() => {
      notify.classList.add("is-visible");
      notify.innerHTML = "Пароль скопійовано!";
      setTimeout(() => {
        notify.classList.remove("is-visible");
      }, 5000);
    })
    .catch((err) => {
      console.error("Clipboard error:", err);
    });
}

/**
 * Клік на "Редагувати" у вікні деталей -> закриваємо деталі, відкриваємо форму
 */
function editCurrentItem() {
  closeDetailModal();
  const item = passwordData[currentIndex];
  openEditModal(item, currentIndex);
}

/**
 * Відкрити модалку редагування/додавання
 * @param {object|null} item
 * @param {number} index
 */
function openEditModal(item, index) {
  currentIndex = index;

  if (item) {
    // Редагування
    editModalTitle.textContent = "Оновити запис";
    appNameInput.value = item.appName;
    appIconInput.value = item.iconUrl || "";
    loginInput.value = item.login;
    passwordInput.value = item.password;
  } else {
    // Новий
    editModalTitle.textContent = "Новий запис";
    appNameInput.value = "";
    appIconInput.value = "";
    loginInput.value = "";
    passwordInput.value = "";
  }

  editModal.classList.remove("hidden");
}

/**
 * Закрити вікно редагування
 */
function closeEditModal() {
  editModal.classList.add("hidden");
}

/**
 * Зберегти зміни (натиснута кнопка "Зберегти" у формі редагування)
 */
async function saveEdit() {
  const appName = appNameInput.value.trim();
  const iconUrl = appIconInput.value.trim();
  const login = loginInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!appName || !login || !pass) {
    alert("Назва, логін і пароль не можуть бути порожніми!");
    return;
  }

  const nowStr = getFormattedDate(); // Отримуємо поточну дату у форматі "ДД.ММ.РРРР"

  if (currentIndex >= 0) {
    // Редагуємо існуючий
    passwordData[currentIndex].appName = appName;
    passwordData[currentIndex].iconUrl = iconUrl;
    passwordData[currentIndex].login = login;
    passwordData[currentIndex].password = pass;
    passwordData[currentIndex].lastUpdated = nowStr; // Оновлюємо дату останньої зміни
  } else {
    // Додаємо новий
    passwordData.push({
      appName,
      iconUrl,
      login,
      password: pass,
      lastUpdated: nowStr, // Дата першого створення буде також датою останньої зміни
    });
  }

  closeEditModal();
  renderGrid();
  await saveData(); // виклик функції збереження (див. нижче)
}

/**
 * Вікно зі списком повідомлень
 */
function openNotificationsModal() {
  notificationsModal.classList.remove("hidden");

  // Позначити всі як прочитані
  notifications.forEach((n) => (n.isRead = true));
  updateUnreadCount();

  // Відмалювати список
  renderNotifications();
}

/**
 * Закрити вікно повідомлень
 */
function closeNotificationsModal() {
  notificationsModal.classList.add("hidden");
}

/**
 * Відмалювати всі notifications у списку
 */
function renderNotifications() {
  notificationList.innerHTML = "";
  notifications.forEach((msg) => {
    const li = document.createElement("li");
    li.textContent = msg.message;
    notificationList.appendChild(li);
  });
}

/**
 * Оновити лічильник непрочитаних
 */
function updateUnreadCount() {
  const unread = notifications.filter((n) => !n.isRead).length;
  notifCountSpan.textContent = unread;

  const messageIcon = document.getElementById("messageIcon");

  if (unread > 0) {
    messageIcon.src = "img/message-av.png";
  } else {
    messageIcon.src = "img/message.png"; // Змінюйте на стандартну іконку
  }
}

const loginContainer = document.getElementById("login-container");
const masterPasswordInput = document.getElementById("masterPasswordInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const mainContainer = document.getElementById("main-container");

const changeMasterModal = document.getElementById("changeMasterModal");
const oldMasterPasswordInput = document.getElementById(
  "oldMasterPasswordInput"
);
const newMasterPasswordInput = document.getElementById(
  "newMasterPasswordInput"
);
const confirmNewMasterPasswordInput = document.getElementById(
  "confirmNewMasterPasswordInput"
);
const saveMasterBtn = document.getElementById("saveMasterBtn");
const cancelMasterBtn = document.getElementById("cancelMasterBtn");
const changeMasterBtn = document.getElementById("changeMasterBtn");

loginBtn.addEventListener("click", async () => {
  masterPassword = masterPasswordInput.value.trim();
  if (!masterPassword) {
    alert("Введіть майстер-пароль!");
    return;
  }

  try {
    await loadData();
    loginContainer.classList.add("hidden");
    mainContainer.classList.remove("hidden");
    checkOldPasswords();
    updateUnreadCount();
  } catch (err) {
    console.error("Login failed or data loading error:", err);
    loginError.classList.remove("hidden");
  }
});

changeMasterBtn.addEventListener("click", () => {
  oldMasterPasswordInput.value = "";
  newMasterPasswordInput.value = "";
  confirmNewMasterPasswordInput.value = "";
  changeMasterModal.classList.remove("hidden");
});

cancelMasterBtn.addEventListener("click", () => {
  changeMasterModal.classList.add("hidden");
});

saveMasterBtn.addEventListener("click", async () => {
  const oldPass = oldMasterPasswordInput.value.trim();
  const newPass = newMasterPasswordInput.value.trim();
  const confirmNewPass = confirmNewMasterPasswordInput.value.trim();

  if (!oldPass || !newPass || !confirmNewPass) {
    alert("Будь ласка, заповніть всі поля!");
    return;
  }

  if (newPass !== confirmNewPass) {
    alert("Новий пароль і його підтвердження не співпадають!");
    return;
  }

  try {
    await window.api.loadEncryptedData(oldPass);
  } catch (err) {
    alert("Поточний пароль введено невірно!");
    return;
  }

  masterPassword = newPass;
  try {
    await saveData();
    alert("Майстер-пароль змінено успішно!");
    changeMasterModal.classList.add("hidden");
  } catch (err) {
    console.error("Помилка зміни майстер-пароля:", err);
    alert("Не вдалося змінити майстер-пароль!");
  }
});

/* --------------------------
   ЗБЕРІГАННЯ ТА ЗАВАНТАЖЕННЯ ДАНИХ (ПАРОЛІВ)
-------------------------- */

async function loadData() {
  try {
    passwordData = await window.api.loadEncryptedData(masterPassword);
    passwordData.forEach(item => {
        if (!item.lastUpdated) {
            item.lastUpdated = getFormattedDate();
        }
        if (item.createdAt) {
            delete item.createdAt;
        }
    });
    renderGrid();
  } catch (err) {
    console.error("Помилка завантаження даних:", err);
    loginError.classList.remove("hidden");
    throw err;
  }
}

async function saveData() {
  try {
    await window.api.saveEncryptedData(masterPassword, passwordData);
  } catch (err) {
    console.error("Помилка збереження даних:", err);
    alert("Не вдалося зберегти дані!");
    throw err;
  }
}

/* --------------------------
   ФУНКЦІЇ ДЛЯ НАЛАШТУВАНЬ
-------------------------- */

function loadSettings() {
  const storedDays = localStorage.getItem("notificationThresholdDays");
  if (storedDays !== null) {
    notificationThresholdDays = parseInt(storedDays, 10);
    if (isNaN(notificationThresholdDays) || notificationThresholdDays < 1) {
        notificationThresholdDays = 60; // Повертаємося до дефолту, якщо значення невірне
    }
  }
  // Встановлюємо значення в поле вводу в налаштуваннях
  notificationDaysInput.value = notificationThresholdDays;
}

function saveSettings() {
  const newDays = parseInt(notificationDaysInput.value, 10);
  if (!isNaN(newDays) && newDays >= 1) {
    notificationThresholdDays = newDays;
    localStorage.setItem("notificationThresholdDays", newDays);
    notify.classList.add("is-visible");
      notify.innerHTML = "Налаштування збережено";
      setTimeout(() => {
        notify.classList.remove("is-visible");
      }, 5000);
    checkOldPasswords();
    updateUnreadCount();
  } else {
    alert("Будь ласка, введіть дійсне число днів (більше 0).");
    notificationDaysInput.value = notificationThresholdDays;
  }
  closeSettingsModal();
}

function openSettingsModal() {
  // Завантажуємо поточне значення у поле перед відкриттям
  notificationDaysInput.value = notificationThresholdDays;
  settingsModal.classList.remove("hidden");
}

function closeSettingsModal() {
  settingsModal.classList.add("hidden");
}

/**
 * Перевірка, чи є старі паролі
 * Тепер використовує notificationThresholdDays з налаштувань!
 */
function checkOldPasswords() {
  notifications = [];
  const now = new Date();

  passwordData.forEach((item, index) => {
    const dateToCheckStr = item.lastUpdated;

    if (!dateToCheckStr) {
      return;
    }

    const [day, month, year] = dateToCheckStr.split('.').map(Number);
    const checkDate = new Date(year, month - 1, day); // Місяці в JS Date від 0 до 11

    const diffTime = Math.abs(now.getTime() - checkDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Використовуємо значення з налаштувань
    if (diffDays > notificationThresholdDays) {
      const message = `Пароль у "${item.appName}" не змінювався понад ${notificationThresholdDays} днів! Оновіть його.`;
      notifications.push({
        message: message,
        isRead: false,
      });
    }
  });
}

/* --------------------------
   ІНІЦІАЛІЗАЦІЯ (СТАРТ)
-------------------------- */

async function init() {
  let storedFilePath = window.localStorage.getItem("dataFilePath");

  if (!storedFilePath) {
    const chosenPath = await showFileChoiceDialog();
    if (chosenPath && chosenPath.path) {
      window.localStorage.setItem("dataFilePath", chosenPath.path);
      await window.api.setFilePath(chosenPath.path);
      if (chosenPath.isNew) {
          passwordData = [];
          await saveData();
      }
    } else {
      alert("Спочатку потрібно вибрати або створити файл!");
      return;
    }
  } else {
    await window.api.setFilePath(storedFilePath);
  }
  loadSettings(); // Завантажуємо налаштування після вибору файлу
}

function showFileChoiceDialog() {
  return new Promise((resolve) => {
    const modal = document.getElementById("fileChoiceModal");
    const btnExisting = document.getElementById("btnChooseExisting");
    const btnCreate = document.getElementById("btnCreateNew");

    modal.classList.remove("hidden");

    const cleanup = () => {
      modal.classList.add("hidden");
      btnExisting.removeEventListener("click", onExisting);
      btnCreate.removeEventListener("click", onCreate);
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

    btnExisting.addEventListener("click", onExisting);
    btnCreate.addEventListener("click", onCreate);
  });
}

// --------------------------
// ОБРОБНИКИ ПОДІЙ
// --------------------------

addAppBtn.addEventListener("click", () => openEditModal(null, -1));

document.getElementById("changeFileBtn").addEventListener("click", async () => {
  const newFilePath = await window.api.pickExistingFile();

  if (newFilePath) {
    window.localStorage.setItem("dataFilePath", newFilePath);
    await window.api.setFilePath(newFilePath);
    await loadData();
    alert("Файл змінено успішно!");
  } else {
    alert("Вибір скасовано.");
  }
});

/**
 * Генерує випадковий пароль заданої довжини
 * @param {number} length - довжина пароля (за замовчуванням 12 символів)
 * @returns {string} - випадковий пароль
 */
function generateRandomPassword(length = 12) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Функція для обробки кліку на кнопку генерації пароля
function handleGeneratePassword() {
  const newPassword = generateRandomPassword(16);
  passwordInput.value = newPassword;
}

document
  .getElementById("generatePasswordBtn")
  .addEventListener("click", handleGeneratePassword);

const searchInput = document.getElementById("searchInput");

function filterApps() {
  const searchTerm = searchInput.value.toLowerCase();
  renderGrid(searchTerm);
}

searchInput.addEventListener("input", filterApps);

document.getElementById("minimizeBtn").addEventListener("click", () => {
  window.api.minimizeWindow();
});

document.getElementById("maximizeBtn").addEventListener("click", () => {
  window.api.maximizeWindow();
});

document.getElementById("closeBtn").addEventListener("click", () => {
  window.api.closeWindow();
});

closeDetailBtn.addEventListener("click", closeDetailModal);
showHideBtn.addEventListener("click", togglePasswordVisibility);
copyBtn.addEventListener("click", copyCurrentPassword);
editBtn.addEventListener("click", editCurrentItem);

saveEditBtn.addEventListener("click", saveEdit);
cancelEditBtn.addEventListener("click", closeEditModal);

notificationsBtn.addEventListener("click", openNotificationsModal);
closeNotificationsBtn.addEventListener("click", closeNotificationsModal);

// ОБРОБНИКИ ПОДІЙ ДЛЯ НАЛАШТУВАНЬ
openSettingsBtn.addEventListener("click", openSettingsModal);
saveSettingsBtn.addEventListener("click", saveSettings);
cancelSettingsBtn.addEventListener("click", closeSettingsModal);

init();