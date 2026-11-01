import { UserIconNameEnum } from '@budgie/contracts';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxOptionChevron } from '../categorize-inbox-option-chevron/categorize-inbox-option-chevron';
import { CategorizeInboxOptionRow } from '../categorize-inbox-option-row/categorize-inbox-option-row';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly title: string;
}

export const CategorizeInboxGroupMoreLabelsOption = ({ cluster, title }: Props) => {
    const { pickClusterLabels } = useCategorizeInboxContext();

    const handlePress = (): void => void pickClusterLabels(cluster);

    return (
        <CategorizeInboxOptionRow
            icon={UserIconNameEnum.Ellipsis}
            title={title}
            accessory={<CategorizeInboxOptionChevron />}
            onPress={handlePress}
        />
    );
};
