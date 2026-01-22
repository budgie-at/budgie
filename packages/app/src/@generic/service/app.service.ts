import { categoryMappingStorageService } from '../../ai/service/category-mapping-storage.service';
import {
    accountRepository,
    categoryRepository,
    db,
    settingsRepository,
    tagRepository,
    transactionEntryRepository,
    transactionRepository
} from '../drizzle/db/db';

class AppService {
    async truncateData() {
        await db.transaction(async tx => {
            await tagRepository.truncate(tx);
            await categoryRepository.truncate(false, tx);
            await transactionEntryRepository.truncate(tx);
            await transactionRepository.truncate(tx);
            await settingsRepository.update({ defaultAccountId: null }, tx);
            await accountRepository.truncate(tx);
        });

        await categoryMappingStorageService.clearCache();
    }
}

export const appService = new AppService();
