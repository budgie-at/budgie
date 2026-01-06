import { bankSyncRepository } from '../../@generic/drizzle/db/db';

class BankSyncService {
    async resetForResync(accountId: number): Promise<void> {
        await bankSyncRepository.resetForResync(accountId);
    }
}

export const bankSyncService = new BankSyncService();
