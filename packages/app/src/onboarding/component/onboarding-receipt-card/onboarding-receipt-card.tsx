import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { cn } from '../../../@generic/utils/cn.util';

import type { OnboardingReceiptRowInterface } from '../../interface/onboarding-receipt-row.interface';

interface Props {
    readonly rows: readonly OnboardingReceiptRowInterface[];
    readonly testID?: string;
}

export const OnboardingReceiptCard = ({ rows, testID }: Props) => (
    <Card variant="secondary" size="sm" className="px-3xl py-0" testID={testID}>
        {rows.map((row, index) => (
            <View
                key={row.label}
                className={cn('flex-row items-center justify-between gap-x-lg py-lg', index > 0 && 'border-t border-secondary-corner')}
            >
                <Text className="text-secondary-foreground text-sm">{row.label}</Text>
                <Text
                    className={cn('text-sm font-semibold text-right flex-shrink', FOREGROUND_COLOR_PALETTE[row.valueVariant ?? 'primary'])}
                >
                    {row.value}
                </Text>
            </View>
        ))}
    </Card>
);
