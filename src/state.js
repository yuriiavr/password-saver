export let passwordData = [];
export let notifications = []; // { message, isRead }
export let currentIndex = -1;
export let isPasswordVisible = false;
export let masterPassword = "";
export let notificationThresholdDays = 60;


export function setPasswordData(data) {

    passwordData = data.map(item => ({
        id: item.id || Date.now() + Math.random().toString(36).substring(2, 9),
        ...item
    }));
}
export function addPasswordDataItem(item) {
    passwordData.push({
        id: Date.now() + Math.random().toString(36).substring(2, 9), 
        ...item
    });
}
export function updatePasswordDataItem(index, item) {
    passwordData[index] = item;
}
export function setCurrentIndex(index) {
    currentIndex = index;
}
export function togglePasswordVisibilityState(forceState = null) {
    if (forceState !== null) {
        isPasswordVisible = forceState;
    } else {
        isPasswordVisible = !isPasswordVisible;
    }
}
export function setMasterPassword(password) {
    masterPassword = password;
}
export function setNotificationThresholdDays(days) {
    notificationThresholdDays = days;
}
export function setNotifications(newNotifications) {
    notifications = newNotifications;
}
export function addNotification(notification) {
    notifications.push(notification);
}