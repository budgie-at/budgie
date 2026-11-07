import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { SignToggleGlyph } from '../../../@generic/component/sign-toggle-glyph/sign-toggle-glyph';
import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-chrome-font-size-multiplier.constant';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly testID: string;
    readonly menuValue?: string;
}

export const BudgetCategoryLimitLabel = ({ icon, title, testID, menuValue }: Props) => (
    <View className="min-h-[44px] flex-row items-center gap-x-xl">
        <GroupedListIcon icon={icon} />
        <View className="flex-1">
            <Text
                className="text-[17px] text-primary"
                numberOfLines={3}
                maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                testID={testID}
            >
                {title}
            </Text>
            {isNotEmptyString(menuValue) ? (
                <View className="flex-row items-center gap-x-xs">
                    <Text
                        className="min-w-0 shrink text-[13px] text-secondary-foreground"
                        numberOfLines={2}
                        maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER}
                    >
                        {menuValue}
                    </Text>
                    <SignToggleGlyph className="text-secondary-foreground" />
                </View>
            ) : null}
        </View>
    </View>
);
