import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { QuickFormValidationSlot } from '../quick-form-validation-slot/quick-form-validation-slot';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';

interface Props {
    readonly label: string | null;
}

export const CreateTransferSecondaryLine = ({ label }: Props) => (
    <View className="h-[16px] -mt-[14px] -mb-[2px] items-center justify-center" testID={SimpleQuickFormSelector.SecondaryLine}>
        <QuickFormValidationSlot numberOfLines={1}>
            {isNotEmptyString(label) ? (
                <Text
                    numberOfLines={1}
                    maxFontSizeMultiplier={1}
                    accessibilityLabel={label}
                    className="text-center text-[13px] leading-[16px] text-secondary-foreground"
                >
                    {label}
                </Text>
            ) : null}
        </QuickFormValidationSlot>
    </View>
);
