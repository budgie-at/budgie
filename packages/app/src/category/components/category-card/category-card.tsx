import { CategoryEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    category: CategoryEntityInterface
    onOpen: (category: CategoryEntityInterface) => void;
}

export const CategoryCard = ({ onOpen, category }: Props) => {
    const handleOpen = () => void onOpen(category);

    return (
        <Card onPress={handleOpen} className="flex-row gap-x-xl items-center">
            <CircleIcon icon={ICONS[category.icon]} size="xl" variant="default" />
            <Text className="text-primary text-sm">{category.title}</Text>
            <Text className="text-secondary-foreground font-medium text-xs ml-auto">
                <Trans>Swipe left</Trans>
            </Text>
        </Card>
    );
};
