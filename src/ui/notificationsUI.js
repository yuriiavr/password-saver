import { notifications, setNotifications } from '../state.js';


export function renderNotifications() {
    const currentNotificationList = document.getElementById("notificationList");
    if (currentNotificationList) {
        currentNotificationList.innerHTML = "";
        notifications.forEach((msg) => {
            const li = document.createElement("li");
            li.dataset.id = msg.id || "";
            li.dataset.threshold = msg.threshold || "";
            
            li.innerHTML = `
                <span>${msg.message}</span>
                <span class="close-notif-item">×</span>
            `;
            currentNotificationList.appendChild(li);
        });
    } else {
        console.error("notificationList element not found in renderNotifications!");
    }
}

export function updateUnreadCount() {
    const unread = notifications.filter((n) => !n.isRead).length;
    const notifCountSpan = document.getElementById("notifCountSpan");
    if (notifCountSpan) {
        notifCountSpan.textContent = unread;
    } else {
        console.error("Error: notifCountSpan element not found!");
    }

    const messageIcon = document.getElementById("messageIcon");
    if (messageIcon) {
        if (unread > 0) {
            messageIcon.src = "img/message-av.png";
        } else {
            messageIcon.src = "img/message.png";
        }
    }
}