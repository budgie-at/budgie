import { Text, View } from 'react-native';

import { STATUS_TONE_FILL_CLASS_NAME } from '../../constant/status-tone-fill-class-name.constant';
import { cn } from '../../utils/cn.util';

import type { StatusToneType } from '../../type/status-tone.type';

interface Props {
    readonly label: string;
    readonly tone: StatusToneType;
    readonly testID?: string;
}

const TONE_TEXT_CLASS_NAME: Record<StatusToneType, string> = {
    positive: 'text-positive-foreground',
    warning: 'text-warning-foreground',
    destructive: 'text-destructive-foreground'
};

export const StatusLabel = ({ label, tone, testID }: Props) => (
    <View className="flex-row items-center gap-x-md">
        <View className="h-[14px] w-[14px] items-center justify-center">
            <View className={cn('absolute h-[14px] w-[14px] rounded-full opacity-[0.18]', STATUS_TONE_FILL_CLASS_NAME[tone])} />
            <View className={cn('h-[7px] w-[7px] rounded-full', STATUS_TONE_FILL_CLASS_NAME[tone])} />
        </View>
        <Text testID={testID} className={cn('text-xs font-semibold uppercase tracking-wider', TONE_TEXT_CLASS_NAME[tone])}>
            {label}
        </Text>
    </View>
);
