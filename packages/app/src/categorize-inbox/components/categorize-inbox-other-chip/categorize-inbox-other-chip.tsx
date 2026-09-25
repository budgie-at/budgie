import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { testID } from '../../../@generic/utils/test-id.util';
import { SuggestionPillContent } from '../../../transaction/components/suggestion-pill-content/suggestion-pill-content';
import { SuggestionPill } from '../../../transaction/components/suggestion-pill/suggestion-pill';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxCategoryChipSelector } from '../categorize-inbox-category-chip/categorize-inbox-category-chip.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const CategorizeInboxOtherChip = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { isBusy, pickOtherCategory } = useCategorizeInboxContext();

    const handlePress = () => {
        if (isBusy) {
            return;
        }

        void pickOtherCategory(cluster);
    };

    const chipClassName = isBusy ? 'opacity-40' : '';

    return (
        <View className={chipClassName}>
            <SuggestionPill
                index={cluster.candidates.length}
                animationDuration={ANIMATION_DURATION}
                staggerDelay={STAGGER_DELAY}
                onPress={handlePress}
                {...testID(CategorizeInboxCategoryChipSelector.Other, cluster.key)}
            >
                <SuggestionPillContent icon={UserIconNameEnum.Ellipsis} title={t`Other…`} />
            </SuggestionPill>
        </View>
    );
};
