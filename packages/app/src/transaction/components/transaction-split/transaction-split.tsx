import {
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Icon } from '../../../@generic/component/icon/icon';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { sumEntriesAmount } from '../../utils/sum-entries-amount.util';
import { TransactionEntry } from '../transaction-entry/transaction-entry';

import { TransactionSplitAllocation } from './transaction-split-allocation';

interface Props {
    readonly entries: TransactionEntryCreateInputInterface[];
    readonly transactionType: TransactionTypeEnum;
    readonly variant: ColorPaletteVariant;
    readonly totalAmount: number;
    readonly accountId: number;
}

const iconVariants = cva('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

const categoryVariants = cva('text-sm font-medium flex-1', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const TransactionSplit = ({ variant, transactionType, entries, accountId, totalAmount }: Props) => {
    const { control } = useFormContext<TransactionCreateInputInterface>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'entries'
    });

    const selectedCategoryIds = entries.map(entry => entry.categoryId).filter(isDefined);

    const { t } = useLingui();

    const entriesAmount = sumEntriesAmount(entries);

    const showSummary = totalAmount !== 0 || entriesAmount !== 0;

    const handleInsert = () => {
        append({
            accountId,
            amount: 0,
            categoryId: null,
            mccCategoryId: null,
            type: transactionType === TransactionTypeEnum.INCOME ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT
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
                <Icon size={16} className={iconVariants({ variant })} icon={UserIconNameEnum.Split} />

                <Text className={categoryVariants({ variant })}>
                    <Trans>Split by Category</Trans>
                </Text>

                <ThemedSwitch value={hasEntries} onValueChange={handleToggleSplits} />
            </View>

            {hasEntries ? (
                <>
                    <View className="gap-y-md mb-lg">
                        {fields.map((field, index) => (
                            <TransactionEntry
                                selectedCategoryIds={selectedCategoryIds}
                                key={field.id}
                                variant={variant}
                                index={index}
                                onRemove={remove}
                            />
                        ))}
                    </View>

                    <View className="mb-lg">
                        <Button
                            className="py-sm bg-transparent"
                            size="sm"
                            variant="ghost"
                            leftIcon={UserIconNameEnum.Plus}
                            content={t`Add Split`}
                            onPress={handleInsert}
                        />
                    </View>

                    {showSummary ? <TransactionSplitAllocation entriesAmount={entriesAmount} totalAmount={totalAmount} /> : null}
                </>
            ) : null}
        </View>
    );
};
