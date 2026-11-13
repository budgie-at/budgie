import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useEffectEvent } from 'react';

import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { YIELD_SOURCE_FOCUS } from '../../../yield/constant/yield-source-focus.constant';
import { useEditTransactionYield } from '../../hook/use-edit-transaction-yield.hook';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { YieldScreenParamsInterface } from '../../../yield/interface/yield-screen-params.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoYieldSourceRow = ({ transaction }: Props) => {
    const { t } = useLingui();
    const { focus } = useLocalSearchParams<YieldScreenParamsInterface>();
    const { openSourcePicker, hasSourceCandidates } = useEditTransactionYield(transaction);
    const { account: source } = useGetAccountByIdQuery(transaction.yieldSourceAccountId ?? 0);

    const focusSource = useEffectEvent(() => {
        if (focus === YIELD_SOURCE_FOCUS) {
            openSourcePicker();
        }
    });

    useEffect(() => {
        if (hasSourceCandidates) {
            focusSource();
        }
    }, [hasSourceCandidates]);

    const linkedSource = source?.title ?? t`Not linked`;
    const sourceValue = hasSourceCandidates ? linkedSource : t`No holding to link yet`;

    return (
        <TransactionInfoRow
            icon={UserIconNameEnum.Link}
            label={t`Source`}
            value={sourceValue}
            testID={TransactionInfoPageSelector.Row.YieldSource}
            {...(hasSourceCandidates && { onPress: openSourcePicker })}
        />
    );
};
