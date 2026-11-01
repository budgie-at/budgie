import { UserIconType } from '@budgie/contracts';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconType;
    readonly variant: ColorPaletteVariant;
    readonly title: string;
    readonly subtitle?: ReactNode;
    readonly right?: ReactNode;
    readonly onPress?: () => void;
    readonly testID?: string;
    readonly titleTestID?: string;
}

export const SettingsRow = ({ icon, variant, title, subtitle, right, onPress, testID, titleTestID }: Props) => {
    const titleClassName = variant === 'destructive' ? 'text-destructive-foreground text-[17px]' : 'text-primary text-[17px]';

    return (
        <GroupedListRow
            left={
                <CircleIcon
                    icon={icon}
                    variant={variant}
                    size={36}
                    iconSize={18}
                    radius={18}
                    border={false}
                    className={TONAL_DISC_BACKGROUND[variant]}
                />
            }
            title={
                <Text className={titleClassName} numberOfLines={2} testID={titleTestID}>
                    {title}
                </Text>
            }
            subtitle={subtitle}
            right={right}
            onPress={onPress}
            testID={testID}
        />
    );
};
