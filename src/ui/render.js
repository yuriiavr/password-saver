import {
  appGrid,
  appDetailModal,
  detailTitle,
  detailIcon,
  detailLogin,
  detailPassword,
  detailUpdated
} from "./domElements.js";
import {
  passwordData,
  currentIndex,
  isPasswordVisible,
  setCurrentIndex,
  togglePasswordVisibilityState,
} from "../state.js";

export function renderGrid(searchTerm = "") {
  if (!appGrid) {
    console.error(
      "Error: appGrid element not found when trying to render grid."
    );
    return;
  }
  appGrid.innerHTML = "";

  const filteredData = passwordData.filter((item) =>
    item.appName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  filteredData.forEach((item) => {
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

    card.addEventListener("click", () => openDetailModal(item.id));
    appGrid.appendChild(card);
  });
}

export function openDetailModal(itemId) {
  const index = passwordData.findIndex((item) => item.id === itemId);
  if (index === -1) {
    console.error("Елемент не знайдено за ID:", itemId);
    return;
  }
  const item = passwordData[index];

  setCurrentIndex(index);
  togglePasswordVisibilityState(false);

  if (detailTitle) detailTitle.textContent = item.appName;
  if (detailIcon) {
    if (item.iconUrl) {
      detailIcon.src = item.iconUrl;
      detailIcon.style.display = "block";
    } else {
      detailIcon.src = "";
      detailIcon.style.display = "none";
    }
  }

  if (detailLogin) detailLogin.textContent = item.login;
  if (detailPassword) detailPassword.textContent = "********";
  if (detailUpdated) detailUpdated.textContent = item.lastUpdated || "";

  if (appDetailModal) {
    appDetailModal.classList.remove("hidden");
  } else {
    console.error("Error: appDetailModal element not found!");
  }
}

export function togglePasswordVisibility() {
  const item = passwordData[currentIndex];
  if (!item) return;

  togglePasswordVisibilityState();
  if (detailPassword) {
    detailPassword.textContent = isPasswordVisible ? item.password : "********";
  } else {
    console.error("Error: detailPassword element not found!");
  }
}

export function showNotification(message) {
  const notificationToast = document.getElementById("notificationToast");
  if (notificationToast) {
    notificationToast.textContent = message;
    notificationToast.classList.remove("hidden");
    notificationToast.classList.add("show-toast");
    setTimeout(() => {
      notificationToast.classList.remove("show-toast");
      notificationToast.classList.add("hidden");
    }, 3000);
  } else {
    console.warn(
      "Notification toast element not found (ID: notificationToast)!"
    );
    notify.classList.add("is-visible");
    notify.innerHTML = message;
    setTimeout(() => {
      notify.classList.remove("is-visible");
    }, 5000);
  }
}
