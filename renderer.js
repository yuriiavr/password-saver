import { init } from './src/main.js';
import { passwordData } from './src/state.js';

init();

window.api.onGetPasswordsForOverlay(() => {
    const safeData = passwordData.map(({ id, appName, login, password, iconUrl }) => ({
        id, appName, login, password, iconUrl: iconUrl || ''
    }));
    window.api.sendPasswordsForOverlay(safeData);
});