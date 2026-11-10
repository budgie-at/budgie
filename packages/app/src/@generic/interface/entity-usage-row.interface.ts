import type { EntityUsageInterface } from './entity-usage.interface';
import type { IdInterface } from './id.interface';

export interface EntityUsageRowInterface extends IdInterface, Pick<EntityUsageInterface, 'transactionCount'> {}
