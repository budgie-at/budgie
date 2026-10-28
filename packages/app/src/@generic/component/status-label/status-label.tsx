import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { STATUS_TONE_FILL_CLASS_NAME } from '../../constant/status-tone-fill-class-name.constant';
import { cn } from '../../utils/cn.util';

import type { StatusToneType } from '../../type/status-tone.type';

interface Props {
    readonly label: string;
    readonly tone: StatusToneType;
    readonly trailing?: string;
    readonly testID?: string;
}

const TONE_TEXT_CLASS_NAME: Record<StatusToneType, string> = {
    positive: 'text-positive-foreground',
    warning: 'text-warning-foreground',
    destructive: 'text-destructive-foreground'
};

export const StatusLabel = ({ label, tone, trailing, testID }: Props) => (
    <View className="flex-row items-center justify-between gap-x-md">
        <View className="shrink flex-row items-center gap-x-md">
            <View className="h-[14px] w-[14px] shrink-0 items-center justify-center">
                <View className={cn('absolute h-[14px] w-[14px] rounded-full opacity-[0.18]', STATUS_TONE_FILL_CLASS_NAME[tone])} />
                <View className={cn('h-[7px] w-[7px] rounded-full', STATUS_TONE_FILL_CLASS_NAME[tone])} />
            </View>
            <Text
                testID={testID}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                className={cn('shrink text-xs font-semibold uppercase tracking-wider', TONE_TEXT_CLASS_NAME[tone])}
            >
                {label}
            </Text>
        </View>
        {isDefined(trailing) ? (
            <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="shrink-0 text-sm text-secondary-foreground">
                {trailing}
            </Text>
        ) : null}
    </View>
);
