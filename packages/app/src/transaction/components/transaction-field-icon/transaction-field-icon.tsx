import { UserIconType } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { RefObject, useImperativeHandle } from 'react';
import Animated from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { TransactionFormRow } from '../transaction-form-row/transaction-form-row';

export interface TransactionFieldIconRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionFieldIconRef | null>;
    readonly icon: UserIconType;
    readonly label: string;
    readonly value?: string;
    readonly placeholder?: string;
    readonly onPress: () => void;
    readonly disabledHint?: string;
    readonly testID?: string;
}

export const TransactionFieldIcon = (props: Props) => {
    const { ref, icon, label, value, placeholder, onPress, disabledHint, testID } = props;

    const { shake, animatedStyle: shakeStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shake }));

    const isDisabled = isNotEmptyString(disabledHint);
    const pressableProps = {
        disabled: isDisabled,
        accessibilityLabel: `${label}: ${value ?? t`not set`}`,
        accessibilityHint: disabledHint,
        accessibilityState: { disabled: isDisabled }
    };

    return (
        <Animated.View style={shakeStyle} className={cn(isDisabled && 'opacity-40')}>
            <TransactionFormRow
                left={<GroupedListIcon icon={icon} />}
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
