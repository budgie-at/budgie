import { AccountTypeEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

import { useFormatYieldRewardUnits } from './use-format-yield-reward-units.hook';
import { useYieldDepositSubtitle } from './use-yield-deposit-subtitle.hook';

import type { YieldPositionSummaryInterface } from '@budgie/market';

export const useYieldPositionSubtitle = (
    position: Pick<
        YieldPositionSummaryInterface,
        'accountType' | 'instrumentType' | 'instrumentCode' | 'earned' | 'rewardUnits' | 'tax' | 'accruing' | 'deadline'
    >
): string => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatRewardUnits = useFormatYieldRewardUnits();
    const depositSubtitle = useYieldDepositSubtitle(position);

    const { instrumentCode } = position;
    const units = formatRewardUnits(position.rewardUnits);
    const net = formatAmount(position.earned - position.tax, symbol);
    const isRated = position.accountType === AccountTypeEnum.DEPOSIT || position.accountType === AccountTypeEnum.SAVINGS;

    if (position.instrumentType === InstrumentTypeEnum.CRYPTO) {
        return t`${units} ${instrumentCode} earned`;
    }

    if (isRated) {
        return isNotEmptyString(depositSubtitle) ? depositSubtitle : t`Interest`;
    }

    return position.instrumentType === InstrumentTypeEnum.FUND ? t`${net} after tax` : t`Passive income`;
};
