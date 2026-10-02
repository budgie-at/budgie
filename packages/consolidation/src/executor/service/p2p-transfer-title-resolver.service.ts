import * as Context from 'effect/Context';

import type { P2pFiatDirectionEnum } from '../../auto/enum/p2p-fiat-direction.enum';

export class P2pTransferTitleResolver extends Context.Service<
    P2pTransferTitleResolver,
    (direction: P2pFiatDirectionEnum, assetCode: string) => string
>()('@budgie/consolidation/P2pTransferTitleResolver') {}
