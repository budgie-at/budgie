import { BankAccountInterface, mapBankAccountToCreateInput } from '@budgie/bank-sync';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { accountService } from '../../account/service/account.service';

import type { AccountEntityInterface, DB, LiabilityAccountCreateInputInterface } from '@budgie/contracts';

export const getOrCreateBankAccount = async (bankAccount: BankAccountInterface, tx?: DB): Promise<AccountEntityInterface> => {
    const existingByExternalId = await accountRepository.findByExternalIds([bankAccount.id]);
    if (isNotEmptyArray(existingByExternalId)) {
        return existingByExternalId[0];
    }

    if (isNotEmptyString(bankAccount.iban)) {
        const existingByIban = await accountRepository.findByIbans([bankAccount.iban]);
        if (isNotEmptyArray(existingByIban)) {
            return existingByIban[0];
        }
    }

    const instruments = await instrumentRepository.getAll();
    const instrument = instruments.find(item => item.code === bankAccount.currencyCode);
    if (!isDefined(instrument)) {
        // oxlint-disable-next-line lingui/no-unlocalized-strings
        throw new Error(`Instrument not found for currency: ${bankAccount.currencyCode}`);
    }

    const input: LiabilityAccountCreateInputInterface = mapBankAccountToCreateInput(bankAccount, instrument.id);

    const [createdAccount] = Object.values(await accountService.bulkCreate([input], tx));
    if (!isDefined(createdAccount)) {
        // oxlint-disable-next-line lingui/no-unlocalized-strings
        throw new Error('Failed to create bank account');
    }

    return createdAccount;
};
