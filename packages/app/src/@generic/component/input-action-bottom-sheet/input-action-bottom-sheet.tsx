import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetScrollView } from '../bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { BottomSheetTextInput } from '../bottom-sheet-text-input/bottom-sheet-text-input';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly variant: ColorPaletteVariant;
    readonly isDisabled?: boolean;
    readonly description: string;
    readonly isLoading?: boolean;
    readonly buttonText: string;
    readonly onSubmit: (value: string) => void;
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly placeholder?: string;
    readonly defaultValue?: string;
}

export const InputActionBottomSheet = (props: Props) => {
    const { ref, icon, isLoading, isDisabled, onSubmit, variant, title, buttonText, description, placeholder, defaultValue = '' } = props;
    const { t } = useLingui();
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    const handleCancel = () => void ref.current?.close();
    const handleSubmit = () => void onSubmit(value);
    const buttonDisabled = isLoading || isDisabled || value.trim().length === 0;

    const submitButtonContent = isLoading ? <ActivityIndicator size="small" /> : buttonText;

    return (
        <BottomSheet ref={ref} enableDynamicSizing enablePanDownToClose>
            <BottomSheetScrollView keyboardShouldPersistTaps="handled">
                <View className="px-7xl py-5xl">
                    <View className="bg-secondary-background p-xl rounded-3xl mx-auto mb-3xl border border-secondary-corner">
                        <Icon icon={icon} className="text-primary" size={28} />
                    </View>

                    <Text className="text-primary text-xl font-semibold text-center mb-sm">{title}</Text>

                    <Text className="text-secondary-foreground text-center text-sm mb-3xl">{description}</Text>

                    <BottomSheetTextInput
                        value={value}
                        onChangeText={setValue}
                        placeholder={placeholder}
                        size="md"
                        className="mb-3xl"
                    />

                    <View className="gap-y-md">
                        <Button content={submitButtonContent} disabled={buttonDisabled} onPress={handleSubmit} variant={variant} size="md" />
                        <Button onPress={handleCancel} content={t`Cancel`} variant="ghost" />
                    </View>
                </View>
            </BottomSheetScrollView>
        </BottomSheet>
    );
};
