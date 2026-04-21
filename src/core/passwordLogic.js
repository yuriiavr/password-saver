import { notifications, passwordData, notificationThresholdDays, setNotifications, addNotification } from '../state.js';
import { updateUnreadCount } from '../ui/notificationsUI.js';

export function checkOldPasswords() {
    setNotifications([]);
    const now = new Date();
    const dismissed = JSON.parse(localStorage.getItem("dismissedNotifications") || "{}");

    passwordData.forEach((item) => {
        const dateToCheckStr = item.lastUpdated;

        if (!dateToCheckStr) {
            return;
        }

        const [day, month, year] = dateToCheckStr.split('.').map(Number);
        const checkDate = new Date(year, month - 1, day);

        const diffTime = Math.abs(now.getTime() - checkDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > notificationThresholdDays) {
            const currentInterval = Math.floor(diffDays / 30) * 30;
            const lastDismissed = dismissed[item.id] || 0;

            if (currentInterval > lastDismissed) {
                const message = `Пароль у "${item.appName}" не змінювався вже ${diffDays} днів!`;
                addNotification({
                    id: item.id,
                    threshold: currentInterval,
                    message: message,
                    isRead: false,
                });
            }
        }
    });
    updateUnreadCount();
}