import { Trans } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { INSTALLMENT_COUNT_OPTIONS } from '../../constant/installment-count-options.constant';
import { InstallmentCountChip } from '../installment-count-chip/installment-count-chip';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';

interface Props {
    readonly amount: number;
}

export const InstallmentCountChips = ({ amount }: Props) => {
    const { control, setValue } = useFormContext<ConvertToInstallmentFormValues>();
    const installmentCount = useWatch({ control, name: 'installmentCount' });

    const handleSelect = (count: number) => {
        setValue('installmentCount', count, { shouldValidate: true });
        setValue('totalAmount', convertFromMicroUnits(amount * count), { shouldValidate: true });
    };

    return (
        <View className="gap-y-md">
            <Text className="text-secondary-foreground uppercase text-xs">
                <Trans>Payments</Trans>
            </Text>
            <View className="flex-row gap-x-xs">
                {INSTALLMENT_COUNT_OPTIONS.map(count => (
                    <InstallmentCountChip key={count} count={count} isSelected={count === installmentCount} onSelect={handleSelect} />
                ))}
            </View>
        </View>
    );
};
