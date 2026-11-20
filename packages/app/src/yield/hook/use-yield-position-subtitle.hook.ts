import { AccountTypeEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { YieldPositionSectionEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';

import { joinYieldSubtitle } from '../utils/join-yield-subtitle.util';

import { useFormatYieldRewardUnits } from './use-format-yield-reward-units.hook';
import { useYieldDepositSubtitle } from './use-yield-deposit-subtitle.hook';
import { useYieldPositionKindLabel } from './use-yield-position-kind-label.hook';
import { useYieldPositionRateText } from './use-yield-position-rate-text.hook';

import type { YieldPositionSummaryInterface } from '@budgie/market';

export const useYieldPositionSubtitle = (
    position: Pick<
        YieldPositionSummaryInterface,
        'accountType' | 'instrumentType' | 'instrumentCode' | 'kind' | 'rewardUnits' | 'accruing' | 'deadline' | 'annualYield' | 'section'
    >
): string => {
    const { t } = useLingui();
    const formatRewardUnits = useFormatYieldRewardUnits();
    const depositSubtitle = useYieldDepositSubtitle(position);
    const kindLabel = useYieldPositionKindLabel(position);
    const rateText = useYieldPositionRateText(position.annualYield, position.section === YieldPositionSectionEnum.CLOSED);

    const { instrumentCode } = position;
    const units = formatRewardUnits(position.rewardUnits);
    const isRated = position.accountType === AccountTypeEnum.DEPOSIT || position.accountType === AccountTypeEnum.SAVINGS;
    const isCrypto = position.instrumentType === InstrumentTypeEnum.CRYPTO;
    const unitsEarned = isCrypto ? t`${units} ${instrumentCode} earned` : null;

    return joinYieldSubtitle([kindLabel, rateText, unitsEarned, isRated ? depositSubtitle : null]);
};
