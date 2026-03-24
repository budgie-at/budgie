import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { TagCardSelectors } from '../../../@e2e/selectors/tag-card.selector';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    tag: TagEntityInterface;
    onOpen: (tag: TagEntityInterface) => void;
}

export const TagCard = ({ onOpen, tag }: Props) => {
    const handleOpen = () => void onOpen(tag);

    return (
        <SimpleHorizontalCell
            testID={TagCardSelectors.Card(tag.title)}
            right={
                <Text className="text-secondary-foreground font-medium text-xs ml-auto">
                    <Trans>Swipe left</Trans>
                </Text>
            }
            onPress={handleOpen}
            left={<CircleIcon icon={UserIconNameEnum.Dot} variant="destructive" size={40} iconSize={72} />}
            title={tag.title}
        />
    );
};
