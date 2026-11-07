import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { TagsSelectorModalSelector } from '../../../app/tags-selector-modal.selector';

interface Props {
    readonly onPress: () => void;
}

export const TagCreateRow = ({ onPress }: Props) => {
    const title = (
        <Text className="text-[17px] text-primary" maxFontSizeMultiplier={1.35} numberOfLines={1} adjustsFontSizeToFit>
            <Trans>Create tag</Trans>
        </Text>
    );

    return <GroupedListRow title={title} onPress={onPress} testID={TagsSelectorModalSelector.CreateButton} />;
};
