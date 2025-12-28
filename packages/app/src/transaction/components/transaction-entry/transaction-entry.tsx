import { TransactionCreateInputInterface } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { View } from 'react-native';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { TransactionEntryCategorySelector } from '../../../category/components/transaction-entry-category-selector/transaction-entry-category-selector';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly onRemove: (index: number) => void;
    readonly variant: ColorPaletteVariant;
    readonly control: Control<TransactionCreateInputInterface>;
    readonly selectedCategoryIds: number[];
    readonly index: number;
}

export const TransactionEntry = ({ variant, control, index, onRemove, selectedCategoryIds }: Props) => {
    const { defaultCurrency, decimalPlaces } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency);

    const handleRemove = () => void onRemove(index);

    const renderCategorySelector = ({
        field: { value, onChange },
        fieldState: { invalid }
    }: UseControllerReturn<TransactionCreateInputInterface, `entries.${number}.categoryId`>) => {
        const status = invalid ? 'error' : 'default';
        const excludeCategoryIds = selectedCategoryIds.filter(id => id !== value);

        return (
            <TransactionEntryCategorySelector
                excludeCategoryIds={excludeCategoryIds}
                status={status}
                variant={variant}
                onSelect={onChange}
                categoryId={value}
            />
        );
    };

    const renderAmountInput = ({
        field: { onChange, value },
        fieldState: { invalid }
    }: UseControllerReturn<TransactionCreateInputInterface, `entries.${number}.amount`>) => {
        const status = invalid ? 'error' : 'default';

        return (
            <AmountInput
                value={value}
                status={status}
                onChangeValue={onChange}
                placeholder={formatMoney(0)}
                inputClassName="text-sm/1 h-full flex-1 text-primary placeholder:text-secondary-foreground rounded-5xl px-lg"
            />
        );
    };

    return (
        <View key={index} className="flex-row items-center p-lg rounded-5xl bg-secondary-background gap-x-md">
            <Controller render={renderCategorySelector} name={`entries.${index}.categoryId`} control={control} />

            <Controller render={renderAmountInput} name={`entries.${index}.amount`} control={control} />

            <HapticPressable onPress={handleRemove} className="p-md">
                <Icon size={16} icon="X" className="text-primary" />
            </HapticPressable>
        </View>
    );
};
