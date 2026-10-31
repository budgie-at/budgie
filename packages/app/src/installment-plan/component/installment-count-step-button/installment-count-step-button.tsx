import { cva } from 'class-variance-authority';
import { Pressable } from 'react-native';

import { ScaledIcon } from '../../../@generic/component/scaled-icon/scaled-icon';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { MAX_INSTALLMENT_COUNT } from '../../constant/convert-to-installment-form-schema.constant';

import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly count: number;
    readonly delta: number;
    readonly minimumCount: number;
    readonly accessibilityLabel: string;
    readonly onSelect: (count: number) => void;
    readonly testID: string;
}

const buttonVariants = cva(
    'min-h-11 min-w-11 items-center justify-center rounded-full border border-ghost-corner p-md bg-primary-reverse shadow-md dark:bg-surface-separator',
    {
        variants: {
            isDisabled: {
                true: 'opacity-40',
                false: 'active:scale-s'
            }
        }
    }
);

export const InstallmentCountStepButton = (props: Props) => {
    const { icon, count, delta, minimumCount, accessibilityLabel, onSelect, testID } = props;
    const [, , hapticSelection] = useVibration();
    const targetCount = count + delta;
    const isDisabled = targetCount < minimumCount || targetCount > MAX_INSTALLMENT_COUNT;
    const accessibilityState = { disabled: isDisabled };

    const handlePress = () => {
        hapticSelection();
        onSelect(targetCount);
    };

    return (
        <Pressable
            className={buttonVariants({ isDisabled })}
            onPress={handlePress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={accessibilityState}
            hitSlop={8}
            testID={testID}
        >
            <ScaledIcon icon={icon} size={20} className="text-primary" />
        </Pressable>
    );
};
