import { AccountTypeEnum, InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useYieldPositionRateText } from '../../hook/use-yield-position-rate-text.hook';
import { useYieldPositionSubtitle } from '../../hook/use-yield-position-subtitle.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldRow } from '../yield-row/yield-row';

import type { YieldPositionSummaryInterface } from '@budgie/market';

interface Props {
    readonly position: Pick<
        YieldPositionSummaryInterface,
        | 'accountId'
        | 'title'
        | 'accountType'
        | 'instrumentCode'
        | 'instrumentType'
        | 'earned'
        | 'rewardUnits'
        | 'tax'
        | 'annualYield'
        | 'accruing'
        | 'interestRate'
        | 'deadline'
    >;
    readonly rangeCaption: string;
}

const CRYPTO_ICON_SIZE = 32;

export const YieldPositionRow = ({ position, rangeCaption }: Props) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const subtitle = useYieldPositionSubtitle(position);
    const secondary = useYieldPositionRateText(position.annualYield);

    const handlePress = () => void router.setParams({ position: String(position.accountId), instrument: '', group: '' });

    const { title } = position;
    const isCrypto = position.instrumentType === InstrumentTypeEnum.CRYPTO;
    const isRated = position.accountType === AccountTypeEnum.DEPOSIT || position.accountType === AccountTypeEnum.SAVINGS;
    const earned = formatAmount(position.earned, symbol);
    const wholeBalance = isCrypto && isDefined(position.annualYield.rate) ? t` on whole balance` : '';
    const accessibilityLabel = t`${title}, earned ${earned} ${rangeCaption}, ${secondary}${wholeBalance}`;
    const accountIcon = isRated ? UserIconNameEnum.PiggyBank : UserIconNameEnum.Landmark;
    const left = isCrypto ? (
        <CryptoCurrencyIcon code={position.instrumentCode} size={CRYPTO_ICON_SIZE} />
    ) : (
        <GroupedListIcon icon={accountIcon} />
    );

    return (
        <YieldRow
            left={left}
            title={title}
            subtitle={subtitle}
            trailing={earned}
            secondary={secondary}
            accessibilityLabel={accessibilityLabel}
            onPress={handlePress}
            testID={PassiveIncomeSelector.Position(position.accountId)}
        />
    );
};
