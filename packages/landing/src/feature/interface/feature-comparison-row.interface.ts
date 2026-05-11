import type { MessageDescriptor } from '@lingui/core';

export interface FeatureComparisonRowInterface {
    readonly label: MessageDescriptor;
    readonly budgieValue: MessageDescriptor;
    readonly competitorValue: MessageDescriptor;
}
