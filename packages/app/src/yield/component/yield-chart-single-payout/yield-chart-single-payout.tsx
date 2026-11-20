import { YieldKindEnum } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import { yieldPayoutsFamily } from '../../constant/yield-payouts-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldPayoutRow } from '../yield-payout-row/yield-payout-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const NO_SIBLINGS: readonly TransactionWithRelationsEntityInterface[] = [];

export const YieldChartSinglePayout = () => {
    const language = useSetting('language');
    const { screenKey } = use(YieldScreenContext);
    const payouts = AsyncResult.getOrElse(
        useLiveAtomValue(yieldPayoutsFamily([screenKey.key, false, language, null])),
        (): TransactionWithRelationsEntityInterface[] => []
    );

    const income = payouts.find(payout => payout.yieldKind !== YieldKindEnum.TAX) ?? payouts.at(0);
    const tax = payouts.find(payout => payout.yieldKind === YieldKindEnum.TAX && payout.id !== income?.id) ?? null;

    if (!isDefined(income)) {
        return null;
    }

    return (
        <YieldPayoutRow
            transaction={income}
            tax={tax}
            siblings={NO_SIBLINGS}
            isUnassigned={false}
            rowPosition={TransactionListRowPositionEnum.SINGLE}
        />
    );
};
