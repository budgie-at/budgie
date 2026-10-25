import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { useIsImportingHistoryQuery } from '../../../sync/query/use-is-importing-history.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetTemplateKindEnum } from '../../enum/budget-template-kind.enum';
import { useBudgetTemplateDraft } from '../../hooks/use-budget-template-draft.hook';
import { BudgetTemplateOptionCard } from '../budget-template-option-card/budget-template-option-card';

interface Props {
    readonly onPress: () => void;
}

export const BudgetSuggestedTemplateCard = ({ onPress }: Props) => {
    const { t } = useLingui();

    const { isAvailable, stats } = useBudgetTemplateDraft(BudgetTemplateKindEnum.SUGGESTED);
    const isHistorySyncing = useIsImportingHistoryQuery();

    if (!isAvailable && !isHistorySyncing) {
        return null;
    }

    const months = stats?.months ?? 0;
    const approxTransactions = Math.round((stats?.transactionsCount ?? 0) / 10) * 10;
    const categoriesCount = stats?.categoriesCount ?? 0;
    const monthsText = t({ message: plural(months, { one: '# month', other: '# months' }) });
    const transactionsText = t({ message: plural(approxTransactions, { one: '~# transaction', other: '~# transactions' }) });
    const categoriesText = t({ message: plural(categoriesCount, { one: '# category', other: '# categories' }) });
    const statsSummary = `${monthsText} · ${transactionsText} · ${categoriesText}`;
    const description = isHistorySyncing ? t`Not all of your bank history is imported yet` : t`Based on your recent spending`;
    const summary = isHistorySyncing ? t`Available once the import finishes` : statsSummary;

    return (
        <BudgetTemplateOptionCard
            testID={BudgetSelector.CreateTemplateSuggestedCard}
            icon={UserIconNameEnum.Sparkles}
            title={t`Suggested`}
            description={description}
            summary={summary}
            onPress={onPress}
            isDisabled={isHistorySyncing}
        />
    );
};
