import { transactionAsync } from '@budgie/contracts';

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
        await transactionAsync(db, async tx => {
            await tagRepository.truncate(tx);
            await categoryRepository.truncate(false, tx);
            await transactionEntryRepository.truncate(tx);
            await transactionRepository.truncate(tx);
            await settingsRepository.update({ defaultAccountId: null }, tx);
            await accountRepository.truncate(tx);
        });
    }
}

export const appService = new AppService();
