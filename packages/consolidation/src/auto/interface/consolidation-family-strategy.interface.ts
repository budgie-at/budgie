import type { ConsolidationFamilyPreviewInterface } from './consolidation-family-preview.interface';
import type { ConsolidationFamilyRunContextInterface } from './consolidation-family-run-context.interface';
import type { ConsolidationFamilyRunResultInterface } from './consolidation-family-run-result.interface';
import type { ConsolidationFamilyKeyEnum } from '../enum/consolidation-family-key.enum';

export interface ConsolidationFamilyStrategyInterface {
    readonly key: ConsolidationFamilyKeyEnum;

    preview(context: ConsolidationFamilyRunContextInterface): Promise<ConsolidationFamilyPreviewInterface>;

    process(context: ConsolidationFamilyRunContextInterface): Promise<ConsolidationFamilyRunResultInterface>;
}
