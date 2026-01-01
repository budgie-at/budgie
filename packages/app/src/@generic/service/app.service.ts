import {
    accountRepository,
    budgetAllocationInstanceRepository,
    budgetAllocationRepository,
    budgetInstanceRepository,
    budgetRepository,
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
            await budgetAllocationInstanceRepository.truncate(tx);
            await budgetInstanceRepository.truncate(tx);
            await budgetAllocationRepository.truncate(tx);
            await budgetRepository.truncate(tx);
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
