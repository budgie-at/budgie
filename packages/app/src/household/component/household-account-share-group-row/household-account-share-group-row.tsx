import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { GROUPED_LIST_SUBTITLE_CLASSNAME } from '../../../@generic/constant/grouped-list-subtitle-class-name.constant';
import { GROUPED_LIST_TITLE_CLASS_NAME } from '../../../@generic/constant/grouped-list-title-class-name.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { useHouseholdAccountsSharing } from '../../hook/use-household-accounts-sharing.hook';
import { HouseholdAccountShareGroupChevron } from '../household-account-share-group-chevron/household-account-share-group-chevron';

import { HouseholdAccountShareGroupRowSelector } from './household-account-share-group-row.selector';

import type { HouseholdAccountShareEntryInterface } from '../../interface/household-account-share-entry.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly groupKey: string;
    readonly title: string;
    readonly left: ReactNode;
    readonly accounts: readonly Pick<HouseholdAccountShareEntryInterface, 'id' | 'isShared'>[];
    readonly isExpanded: boolean;
    readonly onToggle: () => void;
}

export const HouseholdAccountShareGroupRow = ({ groupKey, title, left, accounts, isExpanded, onToggle }: Props) => {
    const { t } = useLingui();
    const { setShared, isLoading } = useHouseholdAccountsSharing();

    const handleChange = (next: boolean) =>
        void setShared(
            accounts.filter(account => next !== account.isShared).map(account => account.id),
            next
        );

    const accountCount = accounts.length;
    const sharedCount = accounts.filter(account => account.isShared).length;
    const isAllShared = sharedCount === accountCount;
    const partialSubtitle = isPositiveNumber(sharedCount) ? t`${sharedCount} of ${accountCount} shared` : t`Not shared`;
    const subtitle = isAllShared ? t`All shared` : partialSubtitle;
    const accessibilityState = { expanded: isExpanded };

    return (
        <View className="min-h-[50px] flex-row items-center">
            <View className="absolute top-0 right-0 left-[64px] h-hairline bg-surface-separator" pointerEvents="none" />
            <HapticPressable
                onPress={onToggle}
                pressedScale={1}
                accessibilityRole="button"
                accessibilityLabel={`${title}, ${subtitle}`}
                accessibilityHint={t`Shows or hides its accounts`}
                accessibilityState={accessibilityState}
                className="min-w-0 flex-1 flex-row items-center gap-x-xl py-lg pr-lg pl-3xl active:opacity-70"
                testID={HouseholdAccountShareGroupRowSelector.Row(groupKey)}
            >
                {left}
                <View className="min-w-0 flex-1 gap-y-xxs">
                    <Text className={cn('text-primary', GROUPED_LIST_TITLE_CLASS_NAME)} numberOfLines={2}>
                        {title}
                    </Text>
                    <Text className={cn('text-secondary-foreground', GROUPED_LIST_SUBTITLE_CLASSNAME)}>{subtitle}</Text>
                </View>
            </HapticPressable>
            <LoadingContent isLoading={isLoading}>
                <ThemedSwitch
                    value={isAllShared}
                    onValueChange={handleChange}
                    disabled={isLoading}
                    accessibilityLabel={t`Share all ${title}`}
                    testID={HouseholdAccountShareGroupRowSelector.Switch(groupKey)}
                />
            </LoadingContent>
            <HapticPressable
                onPress={onToggle}
                pressedScale={1}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                className="self-stretch justify-center pr-3xl pl-lg active:opacity-70"
                testID={HouseholdAccountShareGroupRowSelector.Expand(groupKey)}
            >
                <HouseholdAccountShareGroupChevron isExpanded={isExpanded} />
            </HapticPressable>
        </View>
    );
};
