import { UserIconType } from '@budgie/contracts';
import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { SettingsRowIcon } from '../settings-row-icon/settings-row-icon';

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
            left={<SettingsRowIcon icon={icon} variant={variant} />}
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
