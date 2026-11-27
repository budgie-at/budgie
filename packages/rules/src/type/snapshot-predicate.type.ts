import type { RuleEvaluationSnapshotInterface } from '../interface/rule-evaluation-snapshot.interface';

export type SnapshotPredicateType = (snapshot: RuleEvaluationSnapshotInterface) => boolean;
