import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

interface Props {
    readonly title: string;
    readonly caption: string | null;
    readonly index: number;
}

export const NumberedStepRow = ({ title, caption, index }: Props) => (
    <View className="min-h-[44px] flex-row items-center gap-x-xl px-3xl py-sm">
        <View className="size-7 items-center justify-center rounded-full bg-surface-disc">
            <Text className="text-[13px] font-semibold text-primary tabular-nums">{index + 1}</Text>
        </View>
        <View className="flex-1 gap-y-xxs">
            <Text className="text-[15px] leading-[20px] text-primary">{title}</Text>
            {isNotEmptyString(caption) ? <Text className="text-[13px] leading-[18px] text-secondary-foreground">{caption}</Text> : null}
        </View>
    </View>
);
