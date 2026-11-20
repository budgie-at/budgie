import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YIELD_BREAKDOWN_ROW_MIN_HEIGHT } from '../../constant/yield-breakdown-row-min-height.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const ROW_STYLE = { style: { minHeight: YIELD_BREAKDOWN_ROW_MIN_HEIGHT } };
const SECONDARY_VALUE_CLASSNAME = 'text-right text-[17px] tabular-nums text-secondary-foreground';

interface Props {
    readonly tax: number;
}

export const YieldBreakdownTax = ({ tax }: Props) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const amount = formatAmount(tax, symbol);

    return (
        <GroupedListRow
            title={t`Tax withheld`}
            testID={PassiveIncomeSelector.TaxWithheld}
            pressableProps={ROW_STYLE}
            right={
                <Text className={SECONDARY_VALUE_CLASSNAME} maxFontSizeMultiplier={2}>
                    {t`−${amount}`}
                </Text>
            }
        />
    );
};
