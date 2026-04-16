import { BankAccountInterface } from '@budgie/bank-sync';
import { ExternalSourceEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository } from '../../@generic/drizzle/db/db';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';

import { generateBankAccountTitle } from './map-bank-account-to-create-input.util';

export const mapBankAccountsToPreview = async (
    bankAccounts: BankAccountInterface[],
    provider: ExternalSourceEnum
): Promise<BankAccountPreviewInterface[]> => {
    const existingAccounts = await accountRepository.findByExternalIds(bankAccounts.map(account => account.id));
    const existingMap = new Map(existingAccounts.map(account => [account.externalId, account]));
    const existingSyncs = await bankSyncRepository.getByProvider(provider);
    const syncedAccountIds = new Set(existingSyncs.map(sync => sync.accountId));

    return bankAccounts.map(bankAccount => {
        const existingAccount = existingMap.get(bankAccount.id);

        return {
            externalId: bankAccount.id,
            title: generateBankAccountTitle(bankAccount),
            currencyCode: bankAccount.currencyCode,
            iban: bankAccount.iban ?? null,
            existingAccountId: existingAccount?.id ?? null,
            hasBankSync: isDefined(existingAccount) && syncedAccountIds.has(existingAccount.id)
        };
    });
};
