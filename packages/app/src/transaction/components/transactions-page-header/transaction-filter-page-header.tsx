import { CategoryEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

interface Props {
    readonly isUncategorized?: boolean;
    readonly isUntagged?: boolean;
    readonly type?: string;
    readonly startDate?: string;
    readonly endDate?: string;
    readonly category?: CategoryEntityInterface | null;
    readonly tag?: TagEntityInterface | null;
    readonly onGoBack: () => void;
}

export const TransactionFilterPageHeader = ({ isUncategorized, isUntagged, category, tag, type, startDate, endDate, onGoBack }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDay } = useFormatDate();

    const categoryName = isUncategorized ? t`Uncategorized` : category?.title;
    const tagName = isUntagged ? t`Untagged` : tag?.title;
    const filterName = categoryName ?? tagName;

    const periodText =
        isDefined(startDate) && isDefined(endDate)
            ? `${formatMonthAndDay(new Date(startDate))} - ${formatMonthAndDay(new Date(endDate))}`
            : null;

    const getTypeText = () => {
        if (type === 'INCOME') {
            return t`Income`;
        }
        if (type === 'EXPENSE') {
            return t`Expenses`;
        }

        return t`Transactions`;
    };

    const title = filterName ?? getTypeText();

    const getSubtitle = () => {
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
