import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import type { CategorizeInboxClusterInterface } from './categorize-inbox-cluster.interface';
import type { CategorizeInboxContextValueInterface } from './categorize-inbox-context-value.interface';

export interface CategorizeInboxAssignInterface extends Pick<
    CategorizeInboxContextValueInterface,
    'assignCluster' | 'assignRow' | 'pickClusterLabels' | 'pickRowLabels'
> {
    readonly toClusterAssignment: (cluster: CategorizeInboxClusterInterface, labelId: number) => CategorizeInboxAssignmentInterface | null;
}
