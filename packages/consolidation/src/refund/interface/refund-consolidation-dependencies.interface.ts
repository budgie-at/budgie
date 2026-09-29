import type { UnconsolidationDependenciesInterface } from '../../executor/interface/unconsolidation-dependencies.interface';
import type { RefundPairRepository } from '../../query/repository/refund-pair.repository';

export interface RefundConsolidationDependenciesInterface extends UnconsolidationDependenciesInterface {
    readonly refundPairRepository: RefundPairRepository;
}
