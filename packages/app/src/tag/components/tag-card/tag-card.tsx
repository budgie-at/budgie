import { TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    tag: TagEntityInterface;
    onOpen: (tag: TagEntityInterface) => void;
}

const iconParams = { variant: 'destructive', size: 40, iconSize: 72 } as const;

export const TagCard = ({ onOpen, tag }: Props) => {
    const handleOpen = () => void onOpen(tag);

    return (
        <SimpleHorizontalCell
            right={
                <Text className="text-secondary-foreground font-medium text-xs ml-auto">
                    <Trans>Swipe left</Trans>
                </Text>
            }
            onPress={handleOpen}
            iconParams={iconParams}
            title={tag.title}
            icon="Dot"
        />
    );
};
