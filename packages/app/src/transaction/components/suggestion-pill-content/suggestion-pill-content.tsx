import { UserIconType } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { SUGGESTION_MAX_FONT_SCALE } from '../../constant/suggestion-max-font-scale.constant';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly badge?: string;
}

const ICON_SIZE = 14;

export const SuggestionPillContent = ({ icon, title, badge }: Props) => (
    <>
        <View className="h-[24px] w-[24px] items-center justify-center rounded-full bg-surface-disc">
            <Icon icon={icon} size={ICON_SIZE} className="text-primary" />
        </View>
        <Text className="shrink text-[13px] font-medium text-primary" maxFontSizeMultiplier={SUGGESTION_MAX_FONT_SCALE} numberOfLines={1}>
            {title}
        </Text>
        {isNotEmptyString(badge) ? (
            <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={SUGGESTION_MAX_FONT_SCALE} numberOfLines={1}>
                {badge}
            </Text>
        ) : null}
    </>
);
