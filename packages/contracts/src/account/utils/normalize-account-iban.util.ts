import * as Schema from 'effect/Schema';

import { isNotEmptyString } from '@rnw-community/shared';

import { AccountIbanSchema } from '../schema/account-iban.schema';

export const normalizeAccountIban = (iban: string | null | undefined): string | null => {
    if (!isNotEmptyString(iban)) {
        return null;
    }

    const candidate = iban.replaceAll(/\s/gu, '').toUpperCase();

    return Schema.is(AccountIbanSchema)(candidate) ? candidate : null;
};
