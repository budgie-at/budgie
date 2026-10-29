import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { HeaderTextAction } from '../../../@generic/component/header-text-action/header-text-action';
import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetFundsQuery } from '../../query/use-get-budget-funds.query';
import { BudgetFundRow } from '../budget-fund-row/budget-fund-row';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly currencySymbol: string;
}

export const BudgetFundsSection = ({ budget, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { funds } = useGetBudgetFundsQuery(budget.id);

    const handleAddPress = () => {
        router.push('/budget-fund-form');
    };

    const emptyHint = isEmptyArray(funds) ? (
        <Text className="text-sm text-secondary-foreground">
            <Trans>Save up for yearly bills a little each period so they never surprise you</Trans>
        </Text>
    ) : null;

    return (
        <EntranceReveal step={5} className="gap-y-lg">
            <View collapsable={false} testID={BudgetSelector.DetailsFundsSection}>
                <SectionHeader
                    label={t`Set aside`}
                    trailing={<HeaderTextAction label={t`Add`} onPress={handleAddPress} testID={BudgetSelector.DetailsFundAddButton} />}
                />
                <View className="gap-y-xl">
                    {funds.map(fund => (
                        <BudgetFundRow key={fund.id} fund={fund} budget={budget} currencySymbol={currencySymbol} />
                    ))}
                </View>
                {emptyHint}
            </View>
        </EntranceReveal>
    );
};
