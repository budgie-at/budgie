import { ACCOUNT_TITLE_MAX_LENGTH, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { Input } from '../../../@generic/component/input/input';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';

import type { ConvertToInstallmentFormValues } from '../../constant/convert-to-installment-form-schema.constant';
import type { UseControllerReturn } from 'react-hook-form';

export const ConvertToInstallmentTitleField = () => {
    const { t } = useLingui();
    const { control } = useFormContext<ConvertToInstallmentFormValues>();

    const render = ({ field: { value, onChange, onBlur } }: UseControllerReturn<ConvertToInstallmentFormValues, 'title'>) => (
        <View className="flex-row items-center gap-x-sm">
            <Input
                borderless
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                maxLength={ACCOUNT_TITLE_MAX_LENGTH}
                returnKeyType="done"
                placeholder={t`Installment plan`}
                accessibilityLabel={t`Plan name`}
                accessibilityHint={t`Edits the name of the plan`}
                className="h-auto min-w-0 flex-shrink px-0 py-xxs text-(length:--text-3xl) font-semibold"
                testID={ConvertToInstallmentModalSelector.TitleInput}
            />
            <Icon icon={UserIconNameEnum.Pencil} size={16} className="text-secondary-foreground" />
        </View>
    );

    return <Controller control={control} name="title" render={render} />;
};
