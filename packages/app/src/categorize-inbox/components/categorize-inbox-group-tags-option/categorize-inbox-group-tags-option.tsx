import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxOptionChevron } from '../categorize-inbox-option-chevron/categorize-inbox-option-chevron';
import { CategorizeInboxOptionRow } from '../categorize-inbox-option-row/categorize-inbox-option-row';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupTagsOption = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { strategy, addClusterTags } = useCategorizeInboxContext();

    const handlePress = (): void => void addClusterTags(cluster);

    if (!isDefined(strategy?.pickFollowUpTagIds)) {
        return null;
    }

    return (
        <CategorizeInboxOptionRow
            icon={UserIconNameEnum.Tag}
            title={t`Add tags`}
            accessory={<CategorizeInboxOptionChevron />}
            onPress={handlePress}
        />
    );
};
