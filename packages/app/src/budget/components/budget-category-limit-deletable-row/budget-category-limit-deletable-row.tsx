import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';

import { isDefined } from '@rnw-community/shared';

import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetCategoryLimitCompactRowLayout } from '../budget-category-limit-compact-row-layout/budget-category-limit-compact-row-layout';
import { BudgetCategoryLimitLabel } from '../budget-category-limit-label/budget-category-limit-label';
import { BudgetRolloverModeMenu } from '../budget-rollover-mode-menu/budget-rollover-mode-menu';

interface Props {
    readonly categoryId: number;
    readonly index: number;
    readonly testID: string;
    readonly amountInput: ReactNode;
    readonly rolloverName?: `categoryLimits.${number}.rolloverMode`;
    readonly onRemove: (index: number) => void;
}

export const BudgetCategoryLimitDeletableRow = ({ categoryId, index, testID, amountInput, rolloverName, onRemove }: Props) => {
    const { t } = useLingui();
    const { category } = useGetCategoryByIdQuery(categoryId);
    const icon = isDefined(category) ? category.icon : UserIconNameEnum.Shapes;
    const title = isDefined(category) ? category.title : '';
    const confirmation = {
        title: t`Remove category limit?`,
        description: t`Swipe to remove this per-category cap from your budget.`,
        buttonText: t`Remove`
    };
    const leading = isDefined(rolloverName) ? (
        <BudgetRolloverModeMenu name={rolloverName} icon={icon} title={title} testID={testID} />
    ) : (
        <BudgetCategoryLimitLabel icon={icon} title={title} testID={testID} />
    );

    return (
        <DeletableRow id={index} onDelete={onRemove} confirmation={confirmation}>
            <BudgetCategoryLimitCompactRowLayout leading={leading} amountInput={amountInput} />
        </DeletableRow>
    );
};
