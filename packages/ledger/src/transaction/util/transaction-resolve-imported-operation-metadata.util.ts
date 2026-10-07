import { TransactionEntryKindEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micro-units.util';

import type { TransactionEntryCreateInputInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

export const transactionResolveImportedOperationMetadata = (
    existingEntry: Pick<
        TransactionEntryEntityInterface,
        'accountId' | 'amount' | 'type' | 'kind' | 'operationInstrumentId' | 'operationAmount'
    >,
    input: TransactionEntryCreateInputInterface
): Required<Pick<TransactionEntryCreateInputInterface, 'operationInstrumentId' | 'operationAmount'>> => {
    if (isDefined(input.operationInstrumentId) && isDefined(input.operationAmount)) {
        return { operationInstrumentId: input.operationInstrumentId, operationAmount: input.operationAmount };
    }

    if (
        !Object.hasOwn(input, 'operationInstrumentId') &&
        !Object.hasOwn(input, 'operationAmount') &&
        existingEntry.accountId === input.accountId &&
        existingEntry.amount === convertToMicroUnits(input.amount) &&
        existingEntry.type === input.type &&
        existingEntry.kind === (input.kind ?? TransactionEntryKindEnum.PRIMARY) &&
        isDefined(existingEntry.operationInstrumentId) &&
        isDefined(existingEntry.operationAmount)
    ) {
        return { operationInstrumentId: existingEntry.operationInstrumentId, operationAmount: existingEntry.operationAmount };
    }

    return { operationInstrumentId: null, operationAmount: null };
};
