import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { ChevronLinkRow } from '../../../@generic/component/chevron-link-row/chevron-link-row';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { BudgetSelector } from '../../budget.selector';

interface Props {
    readonly upcoming: number;
    readonly count: number;
    readonly currencySymbol: string;
}

export const BudgetVerdictFooter = ({ upcoming, count, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const upcomingAmount = formatProtectedAmount(convertFromMicroUnits(upcoming), currencySymbol);
    const billsLabel = t({ message: plural(count, { one: '# upcoming bill', other: '# upcoming bills' }) });
    const label = t`Reserving ${upcomingAmount} for ${billsLabel}`;

    const handlePress = () => void router.push('/budget-safe-to-spend');

    return (
        <ChevronLinkRow
            label={label}
            variant="secondary"
            textSizeClassName="text-xs"
            testID={BudgetSelector.DetailsReservedLink}
            onPress={handlePress}
        />
    );
};
