import type { P2pFiatDirectionEnum } from '../../auto/enum/p2p-fiat-direction.enum';
import type { UnconsolidationDependenciesInterface } from './unconsolidation-dependencies.interface';

export interface ConsolidationExecutorDependenciesInterface extends UnconsolidationDependenciesInterface {
    readonly resolveP2pTransferTitle: (direction: P2pFiatDirectionEnum, assetCode: string) => string;
}
