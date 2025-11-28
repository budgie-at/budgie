import { TransactionCreateEntityInterface } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { View } from 'react-native';

import { AmountInput } from '../../../@generic/components/amount-input/amount-input';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { TransactionEntryCategorySelector } from '../../../category/components/transaction-entry-category-selector/transaction-entry-category-selector';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly onRemove: (index: number) => void;
    readonly variant: ColorPaletteVariant;
    readonly control: Control<TransactionCreateEntityInterface>;
    readonly index: number;
}

export const TransactionEntry = (props: Props) => {
    const { variant, control, index, onRemove } = props;
    const { defaultCurrency, decimalPlaces } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency);

    const handleRemove = () => void onRemove(index);

    const renderCategorySelector = ({
        field: { onChange, value },
        fieldState: { invalid }
    }: UseControllerReturn<TransactionCreateEntityInterface, `entries.${number}.categoryId`>) => {
        const status = invalid ? 'error' : 'default';

        return <TransactionEntryCategorySelector status={status} variant={variant} onSelect={onChange} categoryId={value} />;
    };

    const renderAmountInput = ({
        field: { onChange, value },
        fieldState: { invalid }
    }: UseControllerReturn<TransactionCreateEntityInterface, `entries.${number}.amount`>) => {
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
                <Icon size={16} icon={ICONS.X} className="text-primary" />
            </HapticPressable>
        </View>
    );
};
