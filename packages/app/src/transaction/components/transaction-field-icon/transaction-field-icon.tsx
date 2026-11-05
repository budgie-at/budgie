import { UserIconType } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { ReactElement, RefObject, useImperativeHandle } from 'react';
import Animated from 'react-native-reanimated';

import { isNotEmptyString, isString } from '@rnw-community/shared';

import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { TransactionFormIcon } from '../transaction-form-icon/transaction-form-icon';
import { TransactionFormRow } from '../transaction-form-row/transaction-form-row';

export interface TransactionFieldIconRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionFieldIconRef | null>;
    readonly icon: UserIconType;
    readonly label: string;
    readonly value?: string;
    readonly placeholder?: string | ReactElement;
    readonly onPress: () => void;
    readonly disabledHint?: string;
    readonly testID?: string;
}

export const TransactionFieldIcon = (props: Props) => {
    const { ref, icon, label, value, placeholder, onPress, disabledHint, testID } = props;

    const { shake, animatedStyle: shakeStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shake }));

    const isDisabled = isNotEmptyString(disabledHint);
    const accessibilityPlaceholder = isString(placeholder) ? placeholder : t`not set`;
    const pressableProps = {
        disabled: isDisabled,
        accessibilityLabel: `${label}: ${value ?? accessibilityPlaceholder}`,
        accessibilityHint: disabledHint,
        accessibilityState: { disabled: isDisabled }
    };

    return (
        <Animated.View style={shakeStyle} className={cn(isDisabled && 'opacity-40')}>
            <TransactionFormRow
                left={<TransactionFormIcon icon={icon} />}
                label={label}
                value={value}
                placeholder={placeholder}
                valueTestID={testIDProps(testID, TestIDPartEnum.TITLE).testID}
                onPress={onPress}
                testID={testID}
                pressableProps={pressableProps}
            />
        </Animated.View>
    );
};
