import { isNotEmptyString } from '@rnw-community/shared';

import { AccountEntitySchema } from '../schema/account-entity.schema';

export const normalizeAccountIban = (iban: string | null | undefined): string | null => {
    if (!isNotEmptyString(iban)) {
        return null;
    }

    const candidate = iban.replaceAll(/\s/gu, '').toUpperCase();

    return AccountEntitySchema.shape.iban.safeParse(candidate).success ? candidate : null;
};
