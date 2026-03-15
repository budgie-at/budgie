import * as Updates from 'expo-updates';

import { bankSyncRepository } from '../drizzle/db/db';
import { appService } from './app.service';

class AppResetService {
    async clearAllData() {
        await appService.truncateData();
        await bankSyncRepository.truncate();
    }

    async clearAllDataAndRestart() {
        await this.clearAllData();
        await Updates.reloadAsync();
    }
}

export const appResetService = new AppResetService();
