import { TransactionAssociationEnum, TransactionCreateEntityInterface, TransactionEntryTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { Switch, Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/components/button/button';
import { Icon } from '../../../@generic/components/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { convertToMicroUnits } from '../../../@generic/utils/convert-to-micro-units.util';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { sumEntriesAmount } from '../../../transaction-entry/utils/sum-entries-amount.util';
import { TransactionEntry } from '../transaction-entry/transaction-entry';

interface Props {
    readonly control: Control<TransactionCreateEntityInterface>;
    readonly variant: ColorPaletteVariant;
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

export const TransactionSplit = ({ control, variant }: Props) => {
    const { defaultCurrency, decimalPlaces } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency);

    const { fields, append, remove } = useFieldArray({
        control,
        name: TransactionAssociationEnum.ENTRIES
    });
    const [entries, amount] = useWatch({ control, name: ['entries', 'amount'] });

    const { t } = useLingui();

    const entriesAmount = sumEntriesAmount(entries);
    const isAllAllocated = entriesAmount === amount;
    const isOverAllocated = entriesAmount > amount;
    const isUnderAllocated = entriesAmount < amount;

    const amountToAllocate = convertToMicroUnits(Math.abs(amount - entriesAmount));

    const showSummary = amount !== 0 || entriesAmount !== 0;

    const handleInsert = () => {
        append({
            amount: 0,
            accountId: 0,
            categoryId: 0,
            instrumentId: 0,
            type: TransactionEntryTypeEnum.DEBIT
        });
    };

    const handleToggleSplits = (checked: boolean) => {
        if (checked) {
            handleInsert();

            return;
        }

        const firstEntry = fields.at(0);
        remove();

        if (isDefined(firstEntry)) {
            append(firstEntry);
        }
    };

    const hasEntries = entries.length > 1;

    return (
        <View>
            <View className="flex-row gap-x-md py-lg px-xl items-center rounded-5xl border border-secondary-corner mb-3xl">
                <Icon size={16} className={iconVariants({ variant })} icon={ICONS.SplitIcon} />

                <Text className={categoryVariants({ variant })}>
                    <Trans>Split by Category</Trans>
                </Text>

                <Switch value={hasEntries} onValueChange={handleToggleSplits} />
            </View>

            {hasEntries ? (
                <>
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

                    {showSummary ? (
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
                    ) : null}
                </>
            ) : null}
        </View>
    );
};
