import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';
import { InstallmentCountStepButton } from '../installment-count-step-button/installment-count-step-button';

interface Props {
    readonly count: number;
    readonly minimumCount: number;
    readonly onChange: (count: number) => void;
}

const MAX_INSTALLMENT_COUNT = 120;

export const InstallmentCountStepper = ({ count, minimumCount, onChange }: Props) => {
    const { t } = useLingui();
    const monthsLabel = t({ message: plural(count, { one: 'month', other: 'months' }) });
    const isAtMinimum = count <= minimumCount;
    const isAtMaximum = count >= MAX_INSTALLMENT_COUNT;

    const handleChangeValue = (value: number) => {
        onChange(Math.min(Math.max(Math.round(value), minimumCount), MAX_INSTALLMENT_COUNT));
    };

    const handleDecrement = () => {
        onChange(count - 1);
    };

    const handleIncrement = () => {
        onChange(count + 1);
    };

    return (
        <View className="flex-row items-center rounded-full bg-secondary-background p-xs">
            <InstallmentCountStepButton
                icon={UserIconNameEnum.Minus}
                isDisabled={isAtMinimum}
                accessibilityLabel={t`Fewer months`}
                onPress={handleDecrement}
                testID={ConvertToInstallmentModalSelector.CountDecrement}
            />
            <View className="flex-1 flex-row items-center justify-center gap-x-xs">
                <AmountInput
                    value={count}
                    onChangeValue={handleChangeValue}
                    commitOnBlur
                    selectTextOnFocus
                    borderless
                    textAlign="right"
                    inputClassName="h-auto min-w-8 px-0 text-lg font-semibold text-primary tabular-nums"
                    accessibilityLabel={t`Number of months`}
                    testID={ConvertToInstallmentModalSelector.CountInput}
                />
                <Text className="text-md font-medium text-secondary-foreground">{monthsLabel}</Text>
            </View>
            <InstallmentCountStepButton
                icon={UserIconNameEnum.Plus}
                isDisabled={isAtMaximum}
                accessibilityLabel={t`More months`}
                onPress={handleIncrement}
                testID={ConvertToInstallmentModalSelector.CountIncrement}
            />
        </View>
    );
};
