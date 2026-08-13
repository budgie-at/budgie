import { BankAccountInterface, formatBankAccountTitle } from '@budgie/bank-sync';
import { ExternalSourceEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository } from '../../@generic/drizzle/db/db';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';

export const mapBankAccountsToPreview = async (
    bankAccounts: BankAccountInterface[],
    provider: ExternalSourceEnum
): Promise<BankAccountPreviewInterface[]> => {
    const existingByExternalId = await accountRepository.findByExternalIds(bankAccounts.map(account => account.id));
    const existingByExternalIdMap = new Map(existingByExternalId.map(account => [account.externalId, account]));
    const existingByIban = await accountRepository.findByIbans(bankAccounts.map(account => account.iban).filter(isNotEmptyString));
    const existingByIbanMap = new Map(existingByIban.map(account => [account.iban, account]));
    const existingSyncs = await bankSyncRepository.getByProvider(provider);
    const syncedAccountIds = new Set(existingSyncs.map(sync => sync.accountId));

    return bankAccounts.map(bankAccount => {
        const existingAccount =
            existingByExternalIdMap.get(bankAccount.id) ??
            (isNotEmptyString(bankAccount.iban) ? existingByIbanMap.get(bankAccount.iban) : null);

        return {
            externalId: bankAccount.id,
            title: formatBankAccountTitle(bankAccount),
            type: bankAccount.type,
            currencyCode: bankAccount.currencyCode,
            iban: bankAccount.iban ?? null,
            existingAccountId: existingAccount?.id ?? null,
            hasBankSync: isDefined(existingAccount) && syncedAccountIds.has(existingAccount.id)
        };
    });
};
