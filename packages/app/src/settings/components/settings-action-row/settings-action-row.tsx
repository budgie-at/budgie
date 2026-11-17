import { UserIconType } from '@budgie/contracts';
import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { SettingsRowAccessoryKindEnum } from '../../enum/settings-row-accessory-kind.enum';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRowIcon } from '../settings-row-icon/settings-row-icon';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly subtitle?: ReactNode;
    readonly isLoading?: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const SettingsActionRow = ({ icon, title, subtitle, isLoading = false, onPress, testID }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const titleLines = isAccessibilityTextSize ? 3 : 2;

    return (
        <GroupedListRow
            left={<SettingsRowIcon icon={icon} variant="ghost" />}
            title={
                <Text className="text-positive-action text-[17px]" numberOfLines={titleLines} maxFontSizeMultiplier={2}>
                    {title}
                </Text>
            }
            subtitle={subtitle}
            right={<SettingsRowAccessory kind={SettingsRowAccessoryKindEnum.ACTION} isLoading={isLoading} />}
            {...(!isLoading && { onPress })}
            testID={testID}
        />
    );
};
