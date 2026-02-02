import { BankAccountInterface } from '@budgie/bank-sync';
import { ExternalSourceEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { accountService } from '../../account/service/account.service';

import { mapBankAccountToCreateInput } from './map-bank-account-to-create-input.util';

import type { AccountEntityInterface, LiabilityAccountCreateInputInterface } from '@budgie/contracts';

export const getOrCreateBankAccount = async (
    bankAccount: BankAccountInterface,
    provider: ExternalSourceEnum
): Promise<AccountEntityInterface> => {
    const existingByExternalId = await accountRepository.findByExternalIds([bankAccount.id]);
    if (isNotEmptyArray(existingByExternalId)) {
        return existingByExternalId[0];
    }

    const existingByIban = await accountRepository.findByIbans([bankAccount.iban ?? '']);
    if (isNotEmptyArray(existingByIban)) {
        return existingByIban[0];
    }

    const instruments = await instrumentRepository.getAll();
    const instrument = instruments.find(item => item.code === bankAccount.currencyCode);
    if (!isDefined(instrument)) {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        throw new Error(`Instrument not found for currency: ${bankAccount.currencyCode}`);
    }

    const input: LiabilityAccountCreateInputInterface = mapBankAccountToCreateInput(bankAccount, instrument.id, provider);

    return Object.values(await accountService.bulkCreate([input]))[0];
};
