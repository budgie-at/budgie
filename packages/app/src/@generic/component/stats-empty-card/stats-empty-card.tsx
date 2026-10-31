import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/title-max-font-size-multiplier.constant';
import { CircleIcon } from '../circle-icon/circle-icon';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly description?: string;
    readonly children?: ReactNode;
    readonly testID?: string;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const StatsEmptyCard = ({ icon, title, description, children, testID }: Props) => (
    <View className="items-center gap-y-xl rounded-3xl bg-grouped-surface-row px-3xl py-7xl" style={continuousCorners} testID={testID}>
        <CircleIcon icon={icon} size={56} iconSize={26} radius={28} border={false} variant="ghost" />

        <View className="items-center gap-y-sm">
            <Text maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER} className="text-center text-lg font-semibold text-primary">
                {title}
            </Text>
            {isNotEmptyString(description) ? <Text className="text-center text-sm text-secondary-foreground">{description}</Text> : null}
        </View>

        {children}
    </View>
);
