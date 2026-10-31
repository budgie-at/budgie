import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useFormatDateRange } from '../../i18n/hook/use-format-date-range.hook';
import { TransactionFilterPageHeaderModeEnum } from '../enum/transaction-filter-page-header-mode.enum';

import type { TransactionFilterPageHeaderPropsInterface } from '../interface/transaction-filter-page-header-props.interface';

export const useTransactionFilterPageTitle = ({ mode, category, tag, type, types, date }: TransactionFilterPageHeaderPropsInterface) => {
    const { t } = useLingui();
    const formatDateRange = useFormatDateRange();

    const hasBothTypes = types?.includes(TransactionTypeEnum.INCOME) === true && types.includes(TransactionTypeEnum.EXPENSE);
    const hasMissingCategories = mode === TransactionFilterPageHeaderModeEnum.MISSING_CATEGORIES;
    const categoryName = hasMissingCategories ? t`Missing categories` : category?.title;
    const tagName = mode === TransactionFilterPageHeaderModeEnum.UNTAGGED ? t`Untagged` : tag?.title;
    const filterName = mode === TransactionFilterPageHeaderModeEnum.BUDGET_OTHER ? t`Other` : (categoryName ?? tagName);
    const periodText = formatDateRange(date);

    const getTypeText = () => {
        if (hasBothTypes) {
            return t`Income and expenses`;
        }

        if (type === TransactionTypeEnum.INCOME) {
            return t`Income`;
        }

        return type === TransactionTypeEnum.EXPENSE ? t`Expenses` : t`Transactions`;
    };

    const subtitle = hasMissingCategories && hasBothTypes ? `${getTypeText()} · ${periodText}` : periodText;

    const title = filterName ?? getTypeText();
    const compactPeriodText = formatDateRange(date, true);

    return { title, subtitle, compactTitle: `${title} · ${compactPeriodText}` };
};
