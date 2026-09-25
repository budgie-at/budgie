import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../context/categorize-inbox.context';

import type { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import type { CategorizeInboxTopSuggestionInterface } from '../interface/categorize-inbox-top-suggestion.interface';
import type { AccessibilityActionEvent } from 'react-native';

const ACCEPT_ACTION_NAME = 'accept';

export const useCategorizeInboxTopSuggestion = (cluster: CategorizeInboxClusterInterface): CategorizeInboxTopSuggestionInterface | null => {
    const { t } = useLingui();
    const { categoriesById, excludedTransactionIds, assignCluster } = useCategorizeInboxContext();

    const [topCandidate] = cluster.candidates;
    const category = isDefined(topCandidate) ? (categoriesById.get(topCandidate.categoryId) ?? null) : null;
    const hasIncludedRows = cluster.rows.some(row => !excludedTransactionIds.has(row.transactionId));

    if (!cluster.hasEvidence || isDefined(cluster.transferKind) || !isDefined(category) || !hasIncludedRows) {
        return null;
    }

    const accept = (): void => void assignCluster(cluster, category.id);

    return {
        category,
        accept,
        accessibilityProps: {
            accessibilityActions: [{ name: ACCEPT_ACTION_NAME, label: t`Accept suggestion` }],
            onAccessibilityAction: (event: AccessibilityActionEvent): void => {
                if (event.nativeEvent.actionName === ACCEPT_ACTION_NAME) {
                    accept();
                }
            }
        }
    };
};
