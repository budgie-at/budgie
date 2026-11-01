import { msg, plural } from '@lingui/core/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import type { useLingui } from '@lingui/react/macro';

export const getCategoryDeleteCopy = (transactionCount: number, t: ReturnType<typeof useLingui>['t']) =>
    isPositiveNumber(transactionCount)
        ? {
              label: t(msg`Move transactions and delete…`),
              footer: t({
                  message: plural(transactionCount, {
                      one: '# transaction will move to the category you pick.',
                      other: '# transactions will move to the category you pick.'
                  })
              })
          }
        : { label: t(msg`Delete category`), footer: t(msg`Not on any transactions. This can’t be undone.`) };
