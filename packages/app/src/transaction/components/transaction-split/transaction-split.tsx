import { TransactionAssociationEnum, TransactionCreateEntityInterface, TransactionEntryTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { Switch, Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/components/button/button';
import { Icon } from '../../../@generic/components/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { sumEntriesAmount } from '../../../transaction-entry/utils/sum-entries-amount.util';
import { TransactionEntry } from '../transaction-entry/transaction-entry';

interface Props {
    readonly control: Control<Pick<TransactionCreateEntityInterface, TransactionAssociationEnum.ENTRIES>>;
    readonly variant: ColorPaletteVariant;
    readonly amount: number;
}

const iconVariants = cva('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

const categoryVariants = cva('text-sm font-medium flex-1', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

const summaryVariants = cva('px-xl py-lg rounded-3xl flex-row items-center gap-x-md', {
    variants: {
        valid: {
            true: 'bg-positive-background',
            false: 'bg-destructive-background'
        }
    }
});

const summaryTextVariants = cva('text-xs', {
    variants: {
        valid: {
            true: 'text-positive-foreground',
            false: 'text-destructive-foreground'
        }
    }
});

export const TransactionSplit = ({ control, variant, amount }: Props) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: TransactionAssociationEnum.ENTRIES
    });
    const entries = useWatch({ control, name: TransactionAssociationEnum.ENTRIES });
    const { defaultCurrency, decimalPlaces } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency);
    const { t } = useLingui();

    const entriesAmount = sumEntriesAmount(entries);
    const isAllAllocated = entriesAmount === amount;
    const isOverAllocated = entriesAmount > amount;
    const isUnderAllocated = entriesAmount < amount;

    const amountToAllocate = Math.abs(amount - entriesAmount);

    const handleInsert = () => {
        append({
            amount: 0,
            accountId: 0,
            instrumentId: 0,
            categoryId: null,
            parentAccountId: 0,
            parentCategoryId: 0,
            type: TransactionEntryTypeEnum.DEBIT,
        });
    };

    return (
        <View>
            <View className="flex-row gap-x-md py-lg px-xl items-center rounded-5xl border border-secondary-corner mb-3xl">
                <Icon size={16} className={iconVariants({ variant })} icon={ICONS.SplitIcon} />

                <Text className={categoryVariants({ variant })}>
                    <Trans>Split by Category</Trans>
                </Text>

                <Switch />
            </View>

            <View className="gap-y-md mb-lg">
                {fields.map((field, index) => (
                    <TransactionEntry key={field.id} variant={variant} control={control} index={index} onRemove={remove} />
                ))}
            </View>

            <View className="mb-lg">
                <Button
                    className="py-sm bg-transparent"
                    size="sm"
                    variant="ghost"
                    leftIcon="Plus"
                    content={t`Add Split`}
                    onPress={handleInsert}
                />
            </View>

            <View className={summaryVariants({ valid: isAllAllocated })}>
                {isAllAllocated ? <Icon icon={ICONS.Check} size={14} className="text-positive-foreground" /> : null}

                <Text className={cn(summaryTextVariants({ valid: isAllAllocated }), 'flex-1')}>
                    {isAllAllocated ? <Trans>Allocated</Trans> : null}
                    {isOverAllocated ? <Trans>Over:</Trans> : null}
                    {isUnderAllocated ? <Trans>Remaining:</Trans> : null}
                </Text>

                {isPositiveNumber(amountToAllocate) ? (
                    <Text className={summaryTextVariants({ valid: isAllAllocated })}>{formatMoney(amountToAllocate)}</Text>
                ) : null}
            </View>
        </View>
    );
};
