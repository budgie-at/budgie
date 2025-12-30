import { CategoryEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    category: CategoryEntityInterface;
    onOpen: (category: CategoryEntityInterface) => void;
}

export const CategoryCard = ({ onOpen, category }: Props) => {
    const handleOpen = () => void onOpen(category);
    const iconParams = { size: 42, iconSize: 20, variant: 'default' } as const;

    return (
        <SimpleHorizontalCell
            icon={category.icon}
            iconParams={iconParams}
            title={category.title}
            right={
                <Text className="text-secondary-foreground font-medium text-xs ml-auto">
                    <Trans>Swipe left</Trans>
                </Text>
            }
            onPress={handleOpen}
            className="flex-row gap-x-xl items-center"
        />
    );
};
