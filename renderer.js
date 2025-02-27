
let passwordData = [];

// Список повідомлень (notifications). Кожен об’єкт має { message, isRead }.
let notifications = [];

// Для зручності відстежимо індекс поточного елемента, який переглядаємо/редагуємо.
let currentIndex = -1;
let isPasswordVisible = false;

let masterPassword = '';



// Елементи DOM
const appGrid = document.getElementById('appGrid');
const addAppBtn = document.getElementById('addAppBtn');

// Модальне вікно деталей
const appDetailModal = document.getElementById('appDetailModal');
const detailTitle = document.getElementById('detailTitle');
const detailIcon = document.getElementById('detailIcon');
const detailLogin = document.getElementById('detailLogin');
const detailPassword = document.getElementById('detailPassword');
const detailUpdated = document.getElementById('detailUpdated');

const closeDetailBtn = document.getElementById('closeDetailBtn');
const showHideBtn = document.getElementById('showHideBtn');
const copyBtn = document.getElementById('copyBtn');
const editBtn = document.getElementById('editBtn');

// Модальне вікно редагування/додавання
const editModal = document.getElementById('editModal');
const editModalTitle = document.getElementById('editModalTitle');
const appNameInput = document.getElementById('appNameInput');
const appIconInput = document.getElementById('appIconInput');
const loginInput = document.getElementById('loginInput');
const passwordInput = document.getElementById('passwordInput');

const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Модальне вікно повідомлень
const notificationsBtn = document.getElementById('notificationsBtn');
const notifCountSpan = document.getElementById('notifCount');
const notificationsModal = document.getElementById('notificationsModal');
const notificationList = document.getElementById('notificationList');
const closeNotificationsBtn = document.getElementById('closeNotificationsBtn');


/* --------------------------
   ФУНКЦІЇ ДЛЯ РОБОТИ З ІНТЕРФЕЙСОМ
-------------------------- */





/**
 * Відмалювати grid із картками. 
 * Кожен об'єкт у passwordData -> одна картка .app-card
 */
function renderGrid() {
  appGrid.innerHTML = '';  // очистити сітку
  // Для кожного елемента у passwordData створюємо картку (app card)
  passwordData.forEach((item, index) => {
    const card = document.createElement('div');
    card.classList.add('app-card');
    // Якщо є іконка, додаємо <img>
    if (item.iconUrl) {
      const img = document.createElement('img');
      img.src = item.iconUrl;
      card.appendChild(img);
    }
    // Додаємо назву застосунку
    const title = document.createElement('div');
    title.classList.add('app-title');
    title.textContent = item.appName;
    card.appendChild(title);
    
    // При кліку на картку відкриваємо деталі (реалізуйте openDetailModal за потребою)
    card.addEventListener('click', () => {
      openDetailModal(index);
    });
    
    appGrid.appendChild(card);
  });
}

/**
 * Відкрити модалку деталей (коли юзер клікає на картку).
 */
function openDetailModal(index) {
  const item = passwordData[index];
  currentIndex = index;
  isPasswordVisible = false;

  detailTitle.textContent = item.appName;
  if (item.iconUrl) {
    detailIcon.src = item.iconUrl;
    detailIcon.style.display = 'block';
  } else {
    // якщо іконки немає
    detailIcon.src = '';
    detailIcon.style.display = 'none';
  }

  detailLogin.textContent = item.login;
  detailPassword.textContent = '********';  // спочатку приховано
  detailUpdated.textContent = item.lastUpdated || '';

  appDetailModal.classList.remove('hidden');
}

/**
 * Закрити вікно деталей
 */
function closeDetailModal() {
  appDetailModal.classList.add('hidden');
}

/**
 * Показати/приховати пароль у вікні деталей
 */
function togglePasswordVisibility() {
  const item = passwordData[currentIndex];
  if (!item) return;
  
  isPasswordVisible = !isPasswordVisible;
  detailPassword.textContent = isPasswordVisible ? item.password : '********';
}

/**
 * Копіювати поточний пароль у буфер
 */
function copyCurrentPassword() {
  const item = passwordData[currentIndex];
  if (!item) return;

  navigator.clipboard.writeText(item.password)
    .then(() => {
      alert("Пароль скопійовано в буфер обміну!");
    })
    .catch(err => {
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
    editModalTitle.textContent = 'Оновити запис';
    appNameInput.value = item.appName;
    appIconInput.value = item.iconUrl || '';
    loginInput.value = item.login;
    passwordInput.value = item.password;
  } else {
    // Новий
    editModalTitle.textContent = 'Новий запис';
    appNameInput.value = '';
    appIconInput.value = '';
    loginInput.value = '';
    passwordInput.value = '';
  }

  editModal.classList.remove('hidden');
}

/**
 * Закрити вікно редагування
 */
function closeEditModal() {
  editModal.classList.add('hidden');
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

  // Дата оновлення
  const nowStr = new Date().toISOString().slice(0,16).replace('T',' ');

  if (currentIndex >= 0) {
    // Редагуємо існуючий
    passwordData[currentIndex].appName = appName;
    passwordData[currentIndex].iconUrl = iconUrl;
    passwordData[currentIndex].login = login;
    passwordData[currentIndex].password = pass;
    passwordData[currentIndex].lastUpdated = nowStr;
  } else {
    // Додаємо новий
    passwordData.push({
      appName,
      iconUrl,
      login,
      password: pass,
      lastUpdated: nowStr
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
  notificationsModal.classList.remove('hidden');

  // Позначити всі як прочитані
  notifications.forEach(n => n.isRead = true);
  updateUnreadCount();

  // Відмалювати список
  renderNotifications();
}

/**
 * Закрити вікно повідомлень
 */
function closeNotificationsModal() {
  notificationsModal.classList.add('hidden');
}

/**
 * Відмалювати всі notifications у списку
 */
function renderNotifications() {
  notificationList.innerHTML = '';
  notifications.forEach((msg) => {
    const li = document.createElement('li');
    li.textContent = msg.message;
    notificationList.appendChild(li);
  });
}

/**
 * Оновити лічильник непрочитаних
 */
function updateUnreadCount() {
  const unread = notifications.filter(n => !n.isRead).length;
  notifCountSpan.textContent = unread;
}


const loginContainer = document.getElementById('login-container');
const masterPasswordInput = document.getElementById('masterPasswordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

// Елементи основного інтерфейсу
const mainContainer = document.getElementById('main-container');
// Інші елементи вашого UI…

// Елементи для модального вікна зміни майстер-пароля
const changeMasterModal = document.getElementById('changeMasterModal');
const oldMasterPasswordInput = document.getElementById('oldMasterPasswordInput');
const newMasterPasswordInput = document.getElementById('newMasterPasswordInput');
const confirmNewMasterPasswordInput = document.getElementById('confirmNewMasterPasswordInput');
const saveMasterBtn = document.getElementById('saveMasterBtn');
const cancelMasterBtn = document.getElementById('cancelMasterBtn');
const changeMasterBtn = document.getElementById('changeMasterBtn');

loginBtn.addEventListener('click', async () => {
  masterPassword = masterPasswordInput.value.trim();
  if (!masterPassword) {
    alert("Введіть майстер-пароль!");
    return;
  }
  
  // Спроба завантажити дані (перевірка майстер-пароля)
  try {
    await loadData();
    // Якщо завантаження успішне, ховаємо форму логіну та показуємо основний інтерфейс
    loginContainer.classList.add('hidden');
    mainContainer.classList.remove('hidden');
  } catch (err) {
    // Якщо помилка, показуємо повідомлення
    loginError.classList.remove('hidden');
  }
});

changeMasterBtn.addEventListener('click', () => {
  // Очистити поля у модальному вікні
  oldMasterPasswordInput.value = '';
  newMasterPasswordInput.value = '';
  confirmNewMasterPasswordInput.value = '';
  changeMasterModal.classList.remove('hidden');
});

cancelMasterBtn.addEventListener('click', () => {
  changeMasterModal.classList.add('hidden');
});

saveMasterBtn.addEventListener('click', async () => {
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

  // Перевіряємо, чи збігається старий пароль:
  try {
    // Спробуємо завантажити дані із введеним старим паролем:
    await window.api.loadEncryptedData(oldPass);
  } catch (err) {
    alert("Поточний пароль введено невірно!");
    return;
  }

  // Якщо старий пароль вірний, замінюємо masterPassword та зберігаємо дані з новим ключем.
  masterPassword = newPass;
  try {
    await saveData(); // перешифруємо всі дані з новим майстер-паролем
    alert("Майстер-пароль змінено успішно!");
    changeMasterModal.classList.add('hidden');
  } catch (err) {
    console.error("Помилка зміни майстер-пароля:", err);
    alert("Не вдалося змінити майстер-пароль!");
  }
});

/* --------------------------
   ЗБЕРІГАННЯ ТА ЗАВАНТАЖЕННЯ
-------------------------- */

/**
 * Як приклад, фіктивні функції loadData() / saveData().
 * У реальному Electron-додатку викликайте:
 *   let data = await window.api.loadEncryptedData(masterPassword)
 *   await window.api.saveEncryptedData(masterPassword, passwordData)
 */
async function loadData() {
  try {
    // Завантаження даних через IPC (в main.js)
    passwordData = await window.api.loadEncryptedData(masterPassword);
    renderGrid();  // Функція, яка відображає дані (реалізуйте за потребою)
  } catch (err) {
    console.error("Помилка завантаження даних:", err);
    loginError.classList.remove('hidden');
    return;
  }
}

async function saveData() {
  try {
    await window.api.saveEncryptedData(masterPassword, passwordData);
    console.log("Дані збережено успішно");
  } catch (err) {
    console.error("Помилка збереження даних:", err);
    alert("Не вдалося зберегти дані!");
  }
}


/**
 * Перевірка, чи є старі паролі (понад 30 днів) і додавання нотифікацій
 */
function checkOldPasswords() {
  const now = new Date();
  passwordData.forEach(item => {
    if (!item.lastUpdated) return;
    // Конвертуємо "2025-02-20 09:15" у Date
    const last = new Date(item.lastUpdated.replace(' ', 'T'));
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      notifications.push({
        message: `Пароль у ${item.appName} не змінювався понад 30 днів!`,
        isRead: false
      });
    }
  });
}

/* --------------------------
   ІНІЦІАЛІЗАЦІЯ (СТАРТ)
-------------------------- */

/**
 * Завантажуємо дані, оновлюємо інтерфейс, перевіряємо старі паролі.
 */
async function init() {
  let storedFilePath = window.localStorage.getItem('dataFilePath');

  if (!storedFilePath) {
    // Дозволити користувачу вибрати файл або створити новий
    const userChoice = confirm("Ви вже маєте файл з паролями?");
    let chosenPath = null;

    if (userChoice) {
      chosenPath = await window.api.pickExistingFile();
    } else {
      chosenPath = await window.api.pickFileLocation();
    }

    if (chosenPath) {
      window.localStorage.setItem('dataFilePath', chosenPath);
      await window.api.setFilePath(chosenPath);
    } else {
      alert("Спочатку потрібно вибрати або створити файл!");
      return;
    }
  } else {
    await window.api.setFilePath(storedFilePath);
  }

  await loadData();
  checkOldPasswords();
  renderGrid();
  updateUnreadCount();
}


// --------------------------
// ОБРОБНИКИ ПОДІЙ
// --------------------------

// Кнопка «Додати застосунок»
addAppBtn.addEventListener('click', () => openEditModal(null, -1));

document.getElementById('changeFileBtn').addEventListener('click', async () => {
  const newFilePath = await window.api.pickExistingFile();

  if (newFilePath) {
    window.localStorage.setItem('dataFilePath', newFilePath);
    await window.api.setFilePath(newFilePath);
    await loadData();
    alert("Файл змінено успішно!");
  } else {
    alert("Вибір скасовано.");
  }
});


// Детальна модалка
closeDetailBtn.addEventListener('click', closeDetailModal);
showHideBtn.addEventListener('click', togglePasswordVisibility);
copyBtn.addEventListener('click', copyCurrentPassword);
editBtn.addEventListener('click', editCurrentItem);

// Модалка редагування
saveEditBtn.addEventListener('click', saveEdit);
cancelEditBtn.addEventListener('click', closeEditModal);

// Модалка повідомлень
notificationsBtn.addEventListener('click', openNotificationsModal);
closeNotificationsBtn.addEventListener('click', closeNotificationsModal);

// Запускаємо
init();
