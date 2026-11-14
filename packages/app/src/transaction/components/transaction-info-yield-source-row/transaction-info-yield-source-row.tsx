import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useEffectEvent } from 'react';

import { YIELD_SOURCE_FOCUS } from '../../../yield/constant/yield-source-focus.constant';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { YieldScreenParamsInterface } from '../../../yield/interface/yield-screen-params.interface';

interface Props {
    readonly sourceTitle: string | null;
    readonly hasSourceCandidates: boolean;
    readonly onOpenPicker: () => void;
}

export const TransactionInfoYieldSourceRow = ({ sourceTitle, hasSourceCandidates, onOpenPicker }: Props) => {
    const { t } = useLingui();
    const { focus } = useLocalSearchParams<YieldScreenParamsInterface>();

    const focusSource = useEffectEvent(() => {
        if (focus === YIELD_SOURCE_FOCUS) {
            onOpenPicker();
            router.setParams({ focus: '' });
        }
    });

    useEffect(() => {
        if (hasSourceCandidates) {
            focusSource();
        }
    }, [hasSourceCandidates]);

    const linkedSource = sourceTitle ?? t`Not linked`;
    const sourceValue = hasSourceCandidates ? linkedSource : t`No holding to link yet`;

    return (
        <TransactionInfoRow
            icon={UserIconNameEnum.Link}
            label={t`Source`}
            value={sourceValue}
            testID={TransactionInfoPageSelector.Row.YieldSource}
            {...(hasSourceCandidates && { onPress: onOpenPicker })}
        />
    );
};
