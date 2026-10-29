import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetCategoryLimitCompactRowLayout } from '../budget-category-limit-compact-row-layout/budget-category-limit-compact-row-layout';

const ICON_PLACEHOLDER_STYLE: ViewStyle = { width: 32, height: 32 };

interface Props {
    readonly categoryId: number;
    readonly index: number;
    readonly testID: string;
    readonly amountInput: ReactNode;
    readonly subtitle: ReactNode;
    readonly onRemove: (index: number) => void;
}

export const BudgetCategoryLimitDeletableRow = ({ categoryId, index, testID, amountInput, subtitle, onRemove }: Props) => {
    const { t } = useLingui();
    const { category } = useGetCategoryByIdQuery(categoryId);
    const icon = isDefined(category) ? (
        <CircleIcon icon={category.icon} variant="ghost" size={32} iconSize={16} />
    ) : (
        <View style={ICON_PLACEHOLDER_STYLE} />
    );
    const title = isDefined(category) ? category.title : '';
    const confirmation = {
        title: t`Remove category limit?`,
        description: t`Swipe to remove this per-category cap from your budget.`,
        buttonText: t`Remove`
    };

    return (
        <DeletableRow id={index} onDelete={onRemove} confirmation={confirmation}>
            <BudgetCategoryLimitCompactRowLayout amountInput={amountInput} icon={icon} subtitle={subtitle} testID={testID} title={title} />
        </DeletableRow>
    );
};
