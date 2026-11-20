import { AccountTypeEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { useFormatYieldRewardUnits } from './use-format-yield-reward-units.hook';
import { useYieldDepositSubtitle } from './use-yield-deposit-subtitle.hook';
import { useYieldPositionKindLabel } from './use-yield-position-kind-label.hook';

import type { YieldPositionSummaryInterface } from '@budgie/market';

export const useYieldPositionSubtitle = (
    position: Pick<
        YieldPositionSummaryInterface,
        'accountType' | 'instrumentType' | 'instrumentCode' | 'kind' | 'rewardUnits' | 'accruing' | 'deadline'
    >
): string => {
    const { t } = useLingui();
    const formatRewardUnits = useFormatYieldRewardUnits();
    const depositSubtitle = useYieldDepositSubtitle(position);
    const kindLabel = useYieldPositionKindLabel(position);

    const { instrumentCode } = position;
    const units = formatRewardUnits(position.rewardUnits);
    const isRated = position.accountType === AccountTypeEnum.DEPOSIT || position.accountType === AccountTypeEnum.SAVINGS;

    if (position.instrumentType === InstrumentTypeEnum.CRYPTO) {
        return t`${kindLabel} · ${units} ${instrumentCode} earned`;
    }

    return isRated && isNotEmptyString(depositSubtitle) ? t`${kindLabel} · ${depositSubtitle}` : kindLabel;
};
