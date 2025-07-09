import { loadSettings } from './core/settings.js';
import { showFileChoiceDialog } from './ui/modals.js';
import { saveData } from './core/dataManagement.js';
import { setPasswordData } from './state.js';
import { setupEventHandlers } from './eventHandlers.js';
import { notify } from './ui/domElements.js'

export async function init() {
    setupEventHandlers();

    let storedFilePath = window.localStorage.getItem("dataFilePath");

    if (!storedFilePath) {
        const chosenPath = await showFileChoiceDialog();
        if (chosenPath && chosenPath.path) {
            window.localStorage.setItem("dataFilePath", chosenPath.path);
            await window.api.setFilePath(chosenPath.path);
            if (chosenPath.isNew) {
                setPasswordData([]);
                await saveData();
            }
        } else {
            notify.classList.add('is-visible')
            notify.innerHTML = "Для роботи програми необхідно вибрати або створити файл."
            setTimeout(() => {
                notify.classList.remove('is-visible')
            }, 5000)
            return; 
        }
    } else {
        await window.api.setFilePath(storedFilePath);
    }

    loadSettings();

}