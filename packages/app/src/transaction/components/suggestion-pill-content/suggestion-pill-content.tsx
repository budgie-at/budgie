import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly badge?: string;
}

const ICON_SIZE = 24;
const ICON_INNER_SIZE = 12;
const ICON_RADIUS = 12;

export const SuggestionPillContent = ({ icon, title, badge }: Props) => (
    <>
        <CircleIcon icon={icon} size={ICON_SIZE} iconSize={ICON_INNER_SIZE} radius={ICON_RADIUS} variant="secondary" />
        <Text className="text-sm text-default-foreground shrink" numberOfLines={1}>
            {title}
        </Text>
        {isNotEmptyString(badge) ? (
            <View className="bg-secondary-background rounded-full px-xs py-xxs">
                <Text className="text-xs text-secondary-foreground" numberOfLines={1}>
                    {badge}
                </Text>
            </View>
        ) : null}
    </>
);
