import { BudgetLimitChangeReasonEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetLimitChangesQuery } from '../../query/use-get-budget-limit-changes.query';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: Pick<BudgetEntityInterface, 'id' | 'isAutoTuneEnabled'>;
    readonly currencySymbol: string;
}

export const BudgetLimitChangesRow = ({ budget, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useFormatDigits(0);
    const { limitChanges } = useGetBudgetLimitChangesQuery(budget.id);
    const [latestChange] = limitChanges;
    const latestCategoryId = isDefined(latestChange) && isDefined(latestChange.categoryId) ? latestChange.categoryId : 0;
    const { category } = useGetCategoryByIdQuery(latestCategoryId);
    const name = isDefined(category) ? category.title : t`Other`;
    const amountLabel = isDefined(latestChange) ? formatDigits(convertFromMicroUnits(latestChange.newAmount), currencySymbol) : '';
    const idleLabel = budget.isAutoTuneEnabled ? t`Limits are tuned automatically after 3 steady periods` : t`Automatic tuning is off`;
    const raisedLabel = t`${name} raised to ${amountLabel}`;
    const loweredLabel = t`${name} lowered to ${amountLabel}`;
    const changeLabel =
        isDefined(latestChange) && latestChange.reason === BudgetLimitChangeReasonEnum.OVER_SPENT ? raisedLabel : loweredLabel;
    const subtitle = isDefined(latestChange) ? changeLabel : idleLabel;

    const handlePress = () => {
        router.push('/budget-limit-changes');
    };

    return (
        <EntranceReveal step={5} className="pt-xl">
            <GroupedListSection>
                <GroupedListRow
                    left={<GroupedListIcon icon={UserIconNameEnum.WandSparkles} />}
                    title={t`Limit changes`}
                    subtitle={subtitle}
                    testID={BudgetSelector.DetailsLimitChangesRow}
                    onPress={handlePress}
                />
            </GroupedListSection>
        </EntranceReveal>
    );
};
