import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

export const IBAN_BRIDGE_CONSOLIDATION_TYPES_SQL = `'${TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER}', '${TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER}'`;
