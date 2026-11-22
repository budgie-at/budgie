import { InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { YIELD_ROW_SEPARATOR_INSET } from '../../constant/yield-row-separator-inset.constant';
import { useFormatYieldFigureAmount } from '../../hook/use-format-yield-figure-amount.hook';
import { useYieldPositionSubtitle } from '../../hook/use-yield-position-subtitle.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { getYieldRowBorderClassName } from '../../utils/get-yield-row-border-class-name.util';
import { YieldPositionIcon } from '../yield-position-icon/yield-position-icon';
import { YieldRowSubtitle } from '../yield-row-subtitle/yield-row-subtitle';
import { YieldRow } from '../yield-row/yield-row';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { YieldPositionSummaryInterface } from '@budgie/market';

interface Props {
    readonly position: Pick<
        YieldPositionSummaryInterface,
        | 'accountId'
        | 'title'
        | 'accountType'
        | 'instrumentCode'
        | 'instrumentType'
        | 'kind'
        | 'earned'
        | 'rewardUnits'
        | 'tax'
        | 'annualYield'
        | 'accruing'
        | 'deadline'
        | 'section'
    >;
    readonly rangeCaption: string;
    readonly rowPosition: TransactionListRowPositionEnum;
}

export const YieldPositionRow = ({ position, rangeCaption, rowPosition }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatYieldFigureAmount();
    const subtitle = useYieldPositionSubtitle(position);

    const handlePress = () => void router.setParams({ position: String(position.accountId), instrument: '', group: '' });

    const { title } = position;
    const isCrypto = position.instrumentType === InstrumentTypeEnum.CRYPTO;
    const earned = formatAmount(position.earned);
    const wholeBalance = isCrypto && isDefined(position.annualYield.rate) ? t` on whole balance` : '';
    const accessibilityLabel = t`${title}, earned ${earned} ${rangeCaption}, ${subtitle}${wholeBalance}`;
    const trailing = <Text className="text-[17px] font-semibold tabular-nums text-primary">{earned}</Text>;

    return (
        <TransactionRowSurface
            position={rowPosition}
            separatorInset={YIELD_ROW_SEPARATOR_INSET}
            className={getYieldRowBorderClassName(rowPosition)}
        >
            <YieldRow
                left={<YieldPositionIcon position={position} />}
                title={title}
                subtitle={<YieldRowSubtitle subtitle={subtitle} />}
                trailing={trailing}
                accessibilityLabel={accessibilityLabel}
                onPress={handlePress}
                testID={PassiveIncomeSelector.Position(position.accountId)}
            />
        </TransactionRowSurface>
    );
};
