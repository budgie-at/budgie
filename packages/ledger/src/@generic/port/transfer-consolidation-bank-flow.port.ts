import * as Context from 'effect/Context';

import type { DepositNegativeBalanceError } from '../../account/error/deposit-negative-balance.error';
import type { DebtTransferNotAllowedError } from '../../transaction/error/debt-transfer-not-allowed.error';
import type { AccountNotFoundError, ConsolidationScanScopeInterface, Db, DbError } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export class TransferConsolidationBankFlow extends Context.Service<
    TransferConsolidationBankFlow,
    {
        readonly prepare: (
            scope: ConsolidationScanScopeInterface | null
        ) => Effect.Effect<void, AccountNotFoundError | DbError | DepositNegativeBalanceError, Db>;
        readonly repair: (
            scope: ConsolidationScanScopeInterface | null
        ) => Effect.Effect<void, AccountNotFoundError | DbError | DebtTransferNotAllowedError | DepositNegativeBalanceError, Db>;
    }
>()('@budgie/ledger/TransferConsolidationBankFlow') {}
