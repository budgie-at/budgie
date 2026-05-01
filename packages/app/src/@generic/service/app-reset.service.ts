import { authService } from '../../auth/service/auth.service';
import { bankSyncRepository } from '../drizzle/db/db';
import { reloadApp } from '../utils/reload-app.util';

import { appService } from './app.service';

class AppResetService {
    async clearAllData() {
        await appService.truncateData();
        await bankSyncRepository.truncate();
        await authService.clearAllPins();
    }

    async clearAllDataAndRestart() {
        await this.clearAllData();
        await reloadApp();
    }
}

export const appResetService = new AppResetService();
