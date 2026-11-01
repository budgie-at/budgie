import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';
import { SelectorSearchRow } from '../selector-search-row/selector-search-row';

interface Props {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly placeholder?: string;
    readonly rightActionIcon?: UserIconNameEnum;
    readonly rightActionOnPress?: () => void;
    readonly rightActionTestID?: string;
    readonly testID?: string;
    readonly title?: string;
}

export const SelectorModalSearchHeader = (props: Props) => {
    const { search, onSearchChange, placeholder, rightActionIcon, rightActionOnPress, rightActionTestID, testID, title } = props;
    const { t } = useLingui();

    const hasRightAction = isDefined(rightActionIcon) && isDefined(rightActionOnPress);
    const resolvedPlaceholder = placeholder ?? t`Search...`;

    return (
        <View collapsable={false} className="absolute top-0 left-0 right-0 z-10 pt-4xl pb-lg px-xl bg-primary-reverse">
            {isNotEmptyString(title) ? (
                <Text className="text-primary text-xl font-semibold px-md pb-lg" accessibilityRole="header">
                    {title}
                </Text>
            ) : null}
            <SelectorSearchRow search={search} onSearchChange={onSearchChange} placeholder={resolvedPlaceholder} testID={testID}>
                {hasRightAction && (
                    <HapticPressable
                        onPress={rightActionOnPress}
                        className="h-[48px] w-[48px] items-center justify-center rounded-full bg-surface-fill"
                        testID={rightActionTestID}
                    >
                        <Icon icon={rightActionIcon} size={22} className="text-primary" />
                    </HapticPressable>
                )}
            </SelectorSearchRow>
        </View>
    );
};
