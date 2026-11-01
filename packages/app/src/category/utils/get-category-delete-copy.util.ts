import { msg, plural } from '@lingui/core/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { useLingui } from '@lingui/react/macro';

export const getCategoryDeleteCopy = (transactionCount: number | null, t: ReturnType<typeof useLingui>['t']) => {
    if (isPositiveNumber(transactionCount)) {
        return {
            label: t(msg`Move transactions and delete…`),
            footer: t({
                message: plural(transactionCount, {
                    one: 'Its # transaction moves to the category you pick.',
                    other: 'Its # transactions move to the category you pick.'
                })
            })
        };
    }

    return isDefined(transactionCount)
        ? { label: t(msg`Delete category`), footer: t(msg`Not on any transactions. This can’t be undone.`) }
        : { label: t(msg`Delete category…`), footer: null };
};
