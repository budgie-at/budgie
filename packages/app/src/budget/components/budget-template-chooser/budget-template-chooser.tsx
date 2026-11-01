import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { BudgetSelector } from '../../budget.selector';
import { BudgetTemplateKindEnum } from '../../enum/budget-template-kind.enum';
import { BudgetSuggestedTemplateCard } from '../budget-suggested-template-card/budget-suggested-template-card';
import { BudgetTemplateOptionCard } from '../budget-template-option-card/budget-template-option-card';

const navigateToTemplate = (template: BudgetTemplateKindEnum) => {
    void router.replace({ pathname: '/budget/edit', params: { template } });
};

export const BudgetTemplateChooser = () => {
    const { t } = useLingui();

    const handleSuggested = () => void navigateToTemplate(BudgetTemplateKindEnum.SUGGESTED);
    const handleGeneric = () => void navigateToTemplate(BudgetTemplateKindEnum.GENERIC);
    const handleEmpty = () => void navigateToTemplate(BudgetTemplateKindEnum.EMPTY);

    return (
        <View className="pt-xl">
            <GroupedListSection>
                <BudgetSuggestedTemplateCard onPress={handleSuggested} />

                <BudgetTemplateOptionCard
                    testID={BudgetSelector.CreateTemplateGenericCard}
                    icon={UserIconNameEnum.LayoutGrid}
                    title={t`Starter budget`}
                    description={t`A balanced starter budget with common categories`}
                    onPress={handleGeneric}
                />

                <BudgetTemplateOptionCard
                    testID={BudgetSelector.CreateTemplateEmptyCard}
                    icon={UserIconNameEnum.Plus}
                    title={t`Empty canvas`}
                    description={t`Start from scratch and set every limit yourself`}
                    onPress={handleEmpty}
                />
            </GroupedListSection>
        </View>
    );
};
