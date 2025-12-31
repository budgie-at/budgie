import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Icon } from '../../../@generic/component/icon/icon';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { AccountTypeBottomSheet } from '../account-type-bottom-sheet/account-type-bottom-sheet';

interface Props<T extends { type: AccountTypeEnum }> {
    readonly control: Control<T>;
}

export const AccountTypeSelectorField = <T extends { type: AccountTypeEnum }>({ control }: Props<T>) => {
    const { t, i18n } = useLingui();
    const bottomSheetRef = useRef<BottomSheetInterface | null>(null);

    const handleOpenSheet = () => void bottomSheetRef.current?.open();

    const render = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => {
        const variant = ACCOUNT_COLOR[value];

        return (
            <>
                <FormItem label={t`Account Type`}>
                    <Pressable
                        onPress={handleOpenSheet}
                        className="flex-row items-center justify-between rounded-2xl bg-secondary-background p-xl"
                    >
                        <View className="flex-row items-center gap-x-lg">
                            <CircleIcon icon={ACCOUNT_ICON[value]} variant={variant} size={40} iconSize={18} border={false} />
                            <Text className="text-primary text-base font-medium">{i18n.t(ACCOUNT_TYPE[value])}</Text>
                        </View>

                        <Icon icon="ChevronRight" size={20} className="text-secondary-foreground" />
                    </Pressable>
                </FormItem>

                <AccountTypeBottomSheet ref={bottomSheetRef} currentType={value} onSelect={onChange} />
            </>
        );
    };

    return <Controller render={render} control={control} name={'type' as Path<T>} />;
};
