import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly isInactive: boolean;
    readonly size: number;
    readonly children: ReactNode;
}

const BADGE_SIZE_RATIO = 0.46;
const BADGE_ICON_RATIO = 0.56;
const MIN_BADGE_SIZE = 14;
const BADGE_OVERHANG = 2;

export const AccountInactiveIcon = ({ isInactive, size, children }: Props) => {
    const { t } = useLingui();

    if (!isInactive) {
        return children;
    }

    const badgeSize = Math.max(MIN_BADGE_SIZE, Math.round(size * BADGE_SIZE_RATIO));
    const badgeStyle = { width: badgeSize, height: badgeSize, right: -BADGE_OVERHANG, bottom: -BADGE_OVERHANG };

    return (
        <View>
            <View className="opacity-40">{children}</View>
            <View
                className="absolute items-center justify-center rounded-full border-2 border-secondary-background bg-secondary-corner"
                style={badgeStyle}
                accessibilityLabel={t`Inactive`}
            >
                <Icon
                    icon={UserIconNameEnum.EyeOff}
                    size={Math.round(badgeSize * BADGE_ICON_RATIO)}
                    className="text-secondary-foreground"
                />
            </View>
        </View>
    );
};
