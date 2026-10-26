import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly index: number;
    readonly stepCount: number;
}

const contentVariants = cva('flex-1 gap-y-xs pt-xs', {
    variants: {
        hasNextStep: { true: 'pb-3xl', false: '' }
    }
});

export const ApplePayCaptureSetupRow = ({ title, description, index, stepCount }: Props) => {
    const { t } = useLingui();
    const stepNumber = index + 1;
    const hasNextStep = stepNumber < stepCount;

    return (
        <View className="flex-row gap-x-xl">
            <View className="items-center">
                <View
                    accessible
                    accessibilityLabel={t`Step ${stepNumber}`}
                    className="size-8 rounded-full border border-positive-corner bg-positive-background items-center justify-center"
                >
                    <Text className="text-positive-foreground text-sm font-semibold">{stepNumber}</Text>
                </View>
                {hasNextStep ? <View className="flex-1 w-px bg-secondary-corner my-xs" /> : null}
            </View>
            <View className={contentVariants({ hasNextStep })}>
                <Text className="text-primary text-sm font-semibold">{title}</Text>
                <Text className="text-secondary-foreground text-sm">{description}</Text>
            </View>
        </View>
    );
};
