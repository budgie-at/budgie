import { UserIconNameEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxOptionChevron } from '../categorize-inbox-option-chevron/categorize-inbox-option-chevron';
import { CategorizeInboxOptionRow } from '../categorize-inbox-option-row/categorize-inbox-option-row';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupMoreLabelsOption = ({ cluster }: Props) => {
    const { strategy, pickClusterLabels } = useCategorizeInboxContext();

    const handlePress = (): void => void pickClusterLabels(cluster);

    if (!isDefined(strategy)) {
        return null;
    }

    return (
        <CategorizeInboxOptionRow
            icon={UserIconNameEnum.Ellipsis}
            title={strategy.moreLabels}
            accessory={<CategorizeInboxOptionChevron />}
            onPress={handlePress}
        />
    );
};
