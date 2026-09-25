import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { testID } from '../../../@generic/utils/test-id.util';
import { useNonSystemCategoriesQuery } from '../../../category/query/use-non-system-categories.query';
import { SuggestionPillContent } from '../../../transaction/components/suggestion-pill-content/suggestion-pill-content';
import { SuggestionPill } from '../../../transaction/components/suggestion-pill/suggestion-pill';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxCandidateSourceEnum } from '../../enum/categorize-inbox-candidate-source.enum';
import { CategorizeInboxConfidenceEnum } from '../../enum/categorize-inbox-confidence.enum';

import { CategorizeInboxCategoryChipSelector } from './categorize-inbox-category-chip.selector';

import type { CategorizeInboxCandidateInterface } from '../../interface/categorize-inbox-candidate.interface';
import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly candidate: CategorizeInboxCandidateInterface;
    readonly index: number;
    readonly isTop: boolean;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;
const PERCENT_MULTIPLIER = 100;

export const CategorizeInboxCategoryChip = ({ cluster, candidate, index, isTop }: Props) => {
    const { t } = useLingui();
    const { categories } = useNonSystemCategoriesQuery();
    const { isBusy, assignCluster } = useCategorizeInboxContext();

    const category = categories.find(candidateCategory => candidateCategory.id === candidate.categoryId);

    const handlePress = () => {
        if (isBusy) {
            return;
        }

        void assignCluster(cluster, candidate.categoryId);
    };

    const canShowTopProbability =
        isTop && (cluster.confidence === CategorizeInboxConfidenceEnum.HIGH || cluster.confidence === CategorizeInboxConfidenceEnum.MEDIUM);
    const aiBadge = candidate.source === CategorizeInboxCandidateSourceEnum.AI ? t`AI` : '';
    const badge = canShowTopProbability ? `${Math.round(candidate.probability * PERCENT_MULTIPLIER)}%` : aiBadge;
    const chipClassName = isBusy ? 'opacity-40' : '';

    if (!isDefined(category)) {
        return null;
    }

    return (
        <View className={chipClassName}>
            <SuggestionPill
                index={index}
                animationDuration={ANIMATION_DURATION}
                staggerDelay={STAGGER_DELAY}
                onPress={handlePress}
                {...testID(CategorizeInboxCategoryChipSelector.Chip, cluster.key, index)}
            >
                <SuggestionPillContent icon={category.icon} title={category.title} badge={badge} />
            </SuggestionPill>
        </View>
    );
};
