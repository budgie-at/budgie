import { ReceiptMatchService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import type { ReceiptMatchInputInterface } from '@budgie/ledger';

export const attachReceipt = (receipt: ReceiptMatchInputInterface | null, transactionId: number) =>
    isDefined(receipt)
        ? Effect.flatMap(ReceiptMatchService, receiptMatchService => receiptMatchService.attach(transactionId, receipt))
        : Effect.void;
