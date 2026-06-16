import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { BudgetSelector } from '../../budget.selector';
import { BudgetTemplateKindEnum } from '../../enum/budget-template-kind.enum';
import { useBudgetTemplateDraft } from '../../hooks/use-budget-template-draft.hook';
import { BudgetTemplateOptionCard } from '../budget-template-option-card/budget-template-option-card';

const navigateToTemplate = (template: BudgetTemplateKindEnum) => {
    void router.replace({ pathname: '/budget/edit', params: { template } });
};

export const BudgetTemplateChooser = () => {
    const { t } = useLingui();

    const { isAvailable: isSuggestedAvailable, stats: suggestedStats } = useBudgetTemplateDraft(BudgetTemplateKindEnum.SUGGESTED);

    const handleSuggested = () => void navigateToTemplate(BudgetTemplateKindEnum.SUGGESTED);
    const handleGeneric = () => void navigateToTemplate(BudgetTemplateKindEnum.GENERIC);
    const handleEmpty = () => void navigateToTemplate(BudgetTemplateKindEnum.EMPTY);

    const months = suggestedStats?.months ?? 0;
    const approxTransactions = Math.round((suggestedStats?.transactionsCount ?? 0) / 10) * 10;
    const categoriesCount = suggestedStats?.categoriesCount ?? 0;
    const monthsText = t({ message: plural(months, { one: '# month', other: '# months' }) });
    const transactionsText = t({ message: plural(approxTransactions, { one: '~# transaction', other: '~# transactions' }) });
    const categoriesText = t({ message: plural(categoriesCount, { one: '# category', other: '# categories' }) });
    const suggestedSummary = `${monthsText} · ${transactionsText} · ${categoriesText}`;

    return (
        <View className="gap-y-lg pt-xl">
            {isSuggestedAvailable && (
                <BudgetTemplateOptionCard
                    testID={BudgetSelector.CreateTemplateSuggestedCard}
                    icon={UserIconNameEnum.Sparkles}
                    title={t`Suggested`}
                    description={t`Based on your recent spending`}
                    summary={suggestedSummary}
                    onPress={handleSuggested}
                />
            )}

            <BudgetTemplateOptionCard
                testID={BudgetSelector.CreateTemplateGenericCard}
                icon={UserIconNameEnum.LayoutGrid}
                title={t`Generic`}
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
        </View>
    );
};
