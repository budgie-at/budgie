import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

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
            right={
                <Text className={SECONDARY_VALUE_CLASSNAME} maxFontSizeMultiplier={2}>
                    {t`−${amount}`}
                </Text>
            }
        />
    );
};
