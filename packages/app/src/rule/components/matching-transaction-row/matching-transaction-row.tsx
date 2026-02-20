import {
    TransactionAssociationEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionWithEntriesMccCategoryEntityInterface,
    UserIconNameEnum
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../../transaction/constant/transaction-color.constant';
import { formatOperatedAt } from '../../../transaction/utils/format-operated-at.util';
import { sumEntryAmounts } from '../../../transaction/utils/sum-entry-amounts.util';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { ClassValue } from 'clsx';

const CIRCLE_ICON_SIZE = 28;
const CIRCLE_ICON_INNER_SIZE = 14;
const CIRCLE_ICON_RADIUS = 14;

const amountVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('text-xs font-semibold', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

interface Props {
    readonly transaction: TransactionWithEntriesMccCategoryEntityInterface;
}

export const MatchingTransactionRow = ({ transaction }: Props) => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const categoryId = transaction.entries[0]?.categoryId;
    const { category } = useGetCategoryByIdQuery(categoryId ?? 0);

    const categoryIcon = isDefined(category) ? category.icon : UserIconNameEnum.Circle;
    const colorVariant = TRANSACTION_COLOR[transaction.type];

    const entries = transaction[TransactionAssociationEnum.ENTRIES];
    const isExpenseOrTransfer = transaction.type === TransactionTypeEnum.EXPENSE || transaction.type === TransactionTypeEnum.TRANSFER;
    const entryType = isExpenseOrTransfer ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;
    const amount = convertFromMicroUnits(sumEntryAmounts(entries, entryType));
    const formattedAmount = formatDigits(amount, defaultInstrument.symbol);

    const formattedDate = formatOperatedAt({
        date: transaction.operatedAt,
        today: t`Today`,
        yesterday: t`Yesterday`,
        formatDate: intl.formatDate
    });

    return (
        <View className="flex-row items-center gap-x-lg py-sm">
            <CircleIcon
                icon={categoryIcon}
                size={CIRCLE_ICON_SIZE}
                iconSize={CIRCLE_ICON_INNER_SIZE}
                radius={CIRCLE_ICON_RADIUS}
                border={false}
                variant={colorVariant}
            />
            <View className="flex-1 gap-y-xxs">
                <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
                    {transaction.title}
                </Text>
                <Text className="text-xxs text-secondary-foreground">{formattedDate}</Text>
            </View>
            <Text className={amountVariants({ variant: colorVariant })}>{formattedAmount}</Text>
        </View>
    );
};
