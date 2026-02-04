import { RepeatedTransactionPatternInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

interface Props {
    readonly pattern: RepeatedTransactionPatternInterface;
}

const PILL_ICON_SIZE = 24;
const PILL_ICON_INNER_SIZE = 12;
const PILL_ICON_RADIUS = 12;

export const PatternPillContent = ({ pattern }: Props) => (
    <>
        <CircleIcon
            icon={pattern.categoryIcon}
            size={PILL_ICON_SIZE}
            iconSize={PILL_ICON_INNER_SIZE}
            radius={PILL_ICON_RADIUS}
            variant="secondary"
        />
        <Text className="text-sm text-default-foreground shrink" numberOfLines={1}>
            {pattern.title}
        </Text>
        <View className="bg-secondary-background rounded-full px-xs py-xxs">
            <Text className="text-xs text-secondary-foreground" numberOfLines={1}>
                {pattern.categoryTitle}
            </Text>
        </View>
    </>
);
