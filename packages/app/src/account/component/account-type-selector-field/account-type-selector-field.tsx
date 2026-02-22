import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Icon } from '../../../@generic/component/icon/icon';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountTypeSelectorModal } from '../../context/account-type-selector-modal.context';

interface Props<T extends { type: AccountTypeEnum }> {
    readonly control: Control<T>;
}

export const AccountTypeSelectorField = <T extends { type: AccountTypeEnum }>({ control }: Props<T>) => {
    const { t } = useLingui();
    const [openAccountTypeSelector] = useAccountTypeSelectorModal();

    const render = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => {
        const variant = ACCOUNT_COLOR[value];

        const handleOpenSheet = async () => {
            const result = await openAccountTypeSelector({ currentType: value });

            if (isDefined(result)) {
                onChange(result);
            }
        };

        return (
            <FormItem label={t`Account Type`}>
                <Pressable
                    onPress={handleOpenSheet}
                    className="flex-row items-center justify-between rounded-2xl bg-secondary-background p-xl"
                >
                    <View className="flex-row items-center gap-x-lg">
                        <CircleIcon icon={ACCOUNT_ICON[value]} variant={variant} size={40} iconSize={18} border={false} />
                        <Text className="text-primary text-base font-medium">{t(ACCOUNT_TYPE[value])}</Text>
                    </View>

                    <Icon icon={UserIconNameEnum.ChevronRight} size={20} className="text-secondary-foreground" />
                </Pressable>
            </FormItem>
        );
    };

    return <Controller render={render} control={control} name={'type' as Path<T>} />;
};
