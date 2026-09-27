import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxStrategy } from '../context/categorize-inbox-strategy.context';
import { useCategorizeInboxContext } from '../context/categorize-inbox.context';

import type { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import type { CategorizeInboxTopSuggestionInterface } from '../interface/categorize-inbox-top-suggestion.interface';
import type { AccessibilityActionEvent } from 'react-native';

const ACCEPT_ACTION_NAME = 'accept';

export const useCategorizeInboxTopSuggestion = (cluster: CategorizeInboxClusterInterface): CategorizeInboxTopSuggestionInterface | null => {
    const { t } = useLingui();
    const { labelsById } = useCategorizeInboxStrategy();
    const { excludedTransactionIds, assignCluster } = useCategorizeInboxContext();

    const [topCandidate] = cluster.candidates;
    const label = isDefined(topCandidate) ? (labelsById.get(topCandidate.labelId) ?? null) : null;
    const hasIncludedRows = cluster.rows.some(row => !excludedTransactionIds.has(row.transactionId));

    if (!cluster.hasEvidence || !isDefined(label) || !hasIncludedRows) {
        return null;
    }

    const accept = (): void => void assignCluster(cluster, label.id);

    return {
        label,
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
