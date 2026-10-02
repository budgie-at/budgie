import { ConsolidationCoordinatorService, P2pFiatDirectionEnum, P2pTransferTitleResolver } from '@budgie/consolidation';
import { i18n } from '@lingui/core';
import * as Layer from 'effect/Layer';

export const consolidationCoordinatorLayer = ConsolidationCoordinatorService.layer.pipe(
    Layer.provide(
        Layer.succeed(P2pTransferTitleResolver, (direction: P2pFiatDirectionEnum, assetCode: string): string =>
            direction === P2pFiatDirectionEnum.BUY
                ? i18n._('Binance P2P buy {assetCode}', { assetCode })
                : i18n._('Binance P2P sell {assetCode}', { assetCode })
        )
    )
);
