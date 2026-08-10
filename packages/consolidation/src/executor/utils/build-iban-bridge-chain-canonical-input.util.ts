import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type { IbanBridgeChainCanonicalInputInterface } from '../interface/iban-bridge-chain-canonical-input.interface';

export const buildIbanBridgeChainCanonicalInput = (input: IbanBridgeChainCanonicalInputInterface): CanonicalTransferInputInterface => ({
    title: input.title,
    operatedAt: input.operatedAt,
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    fromAmount: input.fromAmount,
    toAmount: input.toAmount,
    exchangeRate: input.exchangeRate,
    consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
    fromEntryExchangeRate: input.exchangeRate,
    toEntryExchangeRate: 1,
    fromEntryToIban: input.fromEntryToIban
});
