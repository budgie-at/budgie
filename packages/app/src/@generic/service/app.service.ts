import { LanguageEnum, ThemeEnum, transactionAsync } from '@budgie/contracts';

import {
    accountBalanceRepository,
    accountRepository,
    categoryRepository,
    db,
    ruleActionRepository,
    ruleConditionRepository,
    ruleRepository,
    settingsRepository,
    tagRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../drizzle/db/db';

class AppService {
    async truncateData() {
        await transactionAsync(db, async tx => {
            await transactionTagsRepository.truncate();
            await tagRepository.truncate(tx);
            await categoryRepository.truncate(false, tx);
            await transactionEntryRepository.truncate(tx);
            await transactionRepository.truncate(tx);
            await ruleActionRepository.truncate(tx);
            await ruleConditionRepository.truncate(tx);
            await ruleRepository.truncate(tx);
            await accountBalanceRepository.truncate(tx);
            await settingsRepository.update(
                {
                    language: LanguageEnum.EN,
                    defaultAccountId: null,
                    defaultInstrumentId: 1,
                    theme: ThemeEnum.SYSTEM,
                    isPinEnabled: false,
                    isBiometricEnabled: false,
                    showCents: true,
                    isVibrationEnabled: true,
                    isScreenshotProtectionEnabled: false
                },
                tx
            );
            await accountRepository.truncate(tx);
        });
    }
}

export const appService = new AppService();
