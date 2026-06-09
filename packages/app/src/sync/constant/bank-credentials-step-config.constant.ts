import { BINANCE_API_MANAGEMENT_URL, MONOBANK_AUTH_URL } from '@budgie/bank-sync';
import { ExternalSourceEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import { BankCredentialsStepConfigInterface } from '../interface/bank-credentials-step-config.interface';

export const BANK_CREDENTIALS_STEP_CONFIG: Partial<Record<ExternalSourceEnum, BankCredentialsStepConfigInterface>> = {
    [ExternalSourceEnum.MONOBANK]: {
        url: MONOBANK_AUTH_URL,
        title: msg`Get API Token`,
        description: msg`Open Monobank to get your token`,
        modalTitle: msg`Create and copy the personal token`,
        warningTitle: msg`Your token is stored securely in the database. Sync continues in the background.`
    },
    [ExternalSourceEnum.BINANCE]: {
        url: BINANCE_API_MANAGEMENT_URL,
        title: msg`Get API Key`,
        description: msg`Open Binance to get your API key`,
        modalTitle: msg`Create a read-only API key and secret`,
        warningTitle: msg`Use a read-only API key. Your key and secret are stored securely in the database and sync runs in the background.`
    }
};
