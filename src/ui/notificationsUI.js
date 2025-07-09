import { notifications } from '../state.js';


export function renderNotifications() {
    const currentNotificationList = document.getElementById("notificationList");
    if (currentNotificationList) {
        currentNotificationList.innerHTML = "";
        notifications.forEach((msg) => {
            const li = document.createElement("li");
            li.textContent = msg.message;
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