import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';

import type { UserIconNameEnum } from '@budgie/contracts';
import type { PropsWithChildren, ReactNode } from 'react';

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' as const };

interface Props extends PropsWithChildren {
    readonly icon: UserIconNameEnum;
    readonly title: ReactNode;
    readonly description: ReactNode;
    readonly testID?: string;
}

export const StateCard = ({ icon, title, description, testID, children }: Props) => (
    <View className="items-center gap-y-lg rounded-3xl bg-grouped-surface-row px-5xl py-7xl" style={CONTINUOUS_CORNERS} testID={testID}>
        <CircleIcon icon={icon} size={56} iconSize={26} radius={28} variant="secondary" border={false} className="bg-surface-disc" />

        <View className="items-center gap-y-xs">
            <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                className="text-center text-lg font-semibold text-primary"
            >
                {title}
            </Text>
            <Text maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER} className="text-center text-[15px] text-secondary-foreground">
                {description}
            </Text>
        </View>

        {children}
    </View>
);
