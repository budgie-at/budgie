import { UserIconNameEnum, UserIconType } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { RefObject, useImperativeHandle } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { TransactionFieldCaption } from '../transaction-field-caption/transaction-field-caption';

export interface TransactionFieldIconRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionFieldIconRef | null>;
    readonly icon: UserIconType;
    readonly label: string;
    readonly value?: string;
    readonly onPress: () => void;
    readonly accessibilityValue?: string;
    readonly disabledHint?: string;
    readonly testID?: string;
}

const ROW_STYLE = { minHeight: 48, paddingVertical: 10 };

export const TransactionFieldIcon = (props: Props) => {
    const { ref, icon, label, value, onPress, accessibilityValue, disabledHint, testID } = props;

    const { shake, animatedStyle: shakeStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shake }));

    const isDisabled = isNotEmptyString(disabledHint);
    const rowClassName = cn('bg-grouped-surface-row', isDisabled && 'opacity-40');
    const accessibilityLabel = `${label}: ${accessibilityValue ?? value ?? t`not set`}`;
    const pressableProps = {
        style: ROW_STYLE,
        disabled: isDisabled,
        accessibilityLabel,
        accessibilityHint: disabledHint,
        accessibilityState: { disabled: isDisabled }
    };

    return (
        <Animated.View style={shakeStyle} className={rowClassName}>
            <GroupedListRow
                title={<TransactionFieldCaption label={label} value={value} {...testIDProps(testID, TestIDPartEnum.TITLE)} />}
                left={
                    <View className="h-[28px] w-[28px] items-center justify-center">
                        <Icon className="text-secondary-foreground" icon={icon} size={20} />
                    </View>
                }
                right={
                    <View className="w-[24px] shrink-0 items-end">
                        <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
                    </View>
                }
                onPress={onPress}
                testID={testID}
                pressableProps={pressableProps}
            />
        </Animated.View>
    );
};
