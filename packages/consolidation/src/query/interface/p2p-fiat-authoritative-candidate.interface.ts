import type { P2pFiatAtomicCandidateInterface } from './p2p-fiat-atomic-candidate.interface';

export interface P2pFiatAuthoritativeCandidateInterface extends P2pFiatAtomicCandidateInterface {
    readonly quotedAmount: number;
    readonly quoteDelta: number;
}
