import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { TransactionKeypadButton } from '../transaction-keypad-button/transaction-keypad-button';

import { TransactionKeypadSelector } from './transaction-keypad.selector';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly onDigit: (digit: string) => void;
    readonly onDecimal: () => void;
    readonly onBackspace: () => void;
    readonly onLongBackspace: () => void;
    readonly onConfirm: () => void;
    readonly onCancel: () => void;
    readonly isConfirmDisabled?: boolean;
    readonly confirmTestID?: string;
}

export const TransactionKeypad = (props: Props) => {
    const { variant, onDigit, onDecimal, onBackspace, onLongBackspace, onConfirm, onCancel, isConfirmDisabled, confirmTestID } = props;

    const handleDigit1 = () => void onDigit('1');
    const handleDigit2 = () => void onDigit('2');
    const handleDigit3 = () => void onDigit('3');
    const handleDigit4 = () => void onDigit('4');
    const handleDigit5 = () => void onDigit('5');
    const handleDigit6 = () => void onDigit('6');
    const handleDigit7 = () => void onDigit('7');
    const handleDigit8 = () => void onDigit('8');
    const handleDigit9 = () => void onDigit('9');
    const handleDigit0 = () => void onDigit('0');

    return (
        <Animated.View entering={FadeInUp.delay(100).duration(250)} className="flex-1 pb-lg">
            <View className="flex-1 gap-md">
                <View className="flex-1 gap-md">
                    <View className="flex-1 flex-row gap-md">
                        <TransactionKeypadButton value="1" onPress={handleDigit1} testID={TransactionKeypadSelector.Digit('1')} />
                        <TransactionKeypadButton value="2" onPress={handleDigit2} testID={TransactionKeypadSelector.Digit('2')} />
                        <TransactionKeypadButton value="3" onPress={handleDigit3} testID={TransactionKeypadSelector.Digit('3')} />
                    </View>
                    <View className="flex-1 flex-row gap-md">
                        <TransactionKeypadButton value="4" onPress={handleDigit4} testID={TransactionKeypadSelector.Digit('4')} />
                        <TransactionKeypadButton value="5" onPress={handleDigit5} testID={TransactionKeypadSelector.Digit('5')} />
                        <TransactionKeypadButton value="6" onPress={handleDigit6} testID={TransactionKeypadSelector.Digit('6')} />
                    </View>
                    <View className="flex-1 flex-row gap-md">
                        <TransactionKeypadButton value="7" onPress={handleDigit7} testID={TransactionKeypadSelector.Digit('7')} />
                        <TransactionKeypadButton value="8" onPress={handleDigit8} testID={TransactionKeypadSelector.Digit('8')} />
                        <TransactionKeypadButton value="9" onPress={handleDigit9} testID={TransactionKeypadSelector.Digit('9')} />
                    </View>
                    <View className="flex-1 flex-row gap-md">
                        <TransactionKeypadButton value="." onPress={onDecimal} />
                        <TransactionKeypadButton value="0" onPress={handleDigit0} testID={TransactionKeypadSelector.Digit('0')} />
                        <TransactionKeypadButton
                            icon={UserIconNameEnum.Delete}
                            variant="action"
                            onPress={onBackspace}
                            onLongPress={onLongBackspace}
                            testID={TransactionKeypadSelector.Backspace}
                        />
                    </View>
                </View>

                <View className="flex-row gap-md">
                    <TransactionKeypadButton icon={UserIconNameEnum.X} variant="cancel" onPress={onCancel} />
                    <View className="flex-2">
                        <TransactionKeypadButton
                            icon={UserIconNameEnum.CircleCheck}
                            variant="confirm"
                            colorVariant={variant}
                            onPress={onConfirm}
                            disabled={isConfirmDisabled}
                            testID={confirmTestID}
                        />
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};
