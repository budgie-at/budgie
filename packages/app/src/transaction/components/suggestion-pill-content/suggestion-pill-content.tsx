import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly badge?: string;
}

const ICON_SIZE = 14;

export const SuggestionPillContent = ({ icon, title, badge }: Props) => (
    <>
        <View className="w-5 h-5 items-center justify-center rounded-md bg-secondary-background">
            <Icon icon={icon} size={ICON_SIZE} className="text-ghost-foreground" />
        </View>
        <Text className="text-xs font-medium text-ghost-foreground shrink" numberOfLines={1}>
            {title}
        </Text>
        {isNotEmptyString(badge) ? (
            <Text className="text-xs text-secondary-foreground" numberOfLines={1}>
                {badge}
            </Text>
        ) : null}
    </>
);
