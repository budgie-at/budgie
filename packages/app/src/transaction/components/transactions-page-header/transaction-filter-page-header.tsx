import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { TransactionFilterPageHeaderPropsInterface } from '../../interface/transaction-filter-page-header-props.interface';

export const TransactionFilterPageHeader = ({
    isMissingCategories,
    isUncategorized,
    isUntagged,
    category,
    tag,
    type,
    types,
    startDate,
    endDate,
    onGoBack
}: TransactionFilterPageHeaderPropsInterface) => {
    const { t } = useLingui();
    const { formatMonthAndDay } = useFormatDate();

    const getCategoryName = () => {
        if (isMissingCategories) {
            return t`Missing categories`;
        }

        if (isUncategorized) {
            return t`Uncategorized`;
        }

        return category?.title;
    };

    const categoryName = getCategoryName();
    const tagName = isUntagged ? t`Untagged` : tag?.title;
    const filterName = categoryName ?? tagName;
    const hasBothTypes = types?.includes(TransactionTypeEnum.INCOME) === true && types.includes(TransactionTypeEnum.EXPENSE);

    const periodText =
        isDefined(startDate) && isDefined(endDate)
            ? `${formatMonthAndDay(new Date(startDate))} - ${formatMonthAndDay(new Date(endDate))}`
            : null;

    const getTypeText = () => {
        if (hasBothTypes) {
            return t`Income and expenses`;
        }

        if (type === TransactionTypeEnum.INCOME) {
            return t`Income`;
        }

        if (type === TransactionTypeEnum.EXPENSE) {
            return t`Expenses`;
        }

        return t`Transactions`;
    };

    const title = filterName ?? getTypeText();

    const getSubtitle = () => {
        if (isMissingCategories && hasBothTypes) {
            return getTypeText();
        }

        if (filterName && periodText) {
            return periodText;
        }

        if (filterName && isDefined(type)) {
            return getTypeText();
        }

        if (periodText) {
            return periodText;
        }

        return null;
    };

    const subtitle = getSubtitle();

    const bottomContent = subtitle ? <Text className="text-secondary-foreground text-xs">{subtitle}</Text> : null;

    return <PageHeader className="border-b-0" size="md" title={title} bottom={bottomContent} onGoBack={onGoBack} />;
};
