import type { LlamaSubsystemSnapshotInterface } from './llama-subsystem-snapshot.interface';
import type * as Atom from 'effect/reactivity/Atom';

export interface LlamaConfigInterface {
    readonly modelUrl: string;
    readonly modelFilename: string;
    readonly contextSize: number;
    readonly embedding: boolean;
    readonly poolingType?: 'mean' | 'none' | 'cls' | 'last';
    readonly snapshot: Atom.Writable<LlamaSubsystemSnapshotInterface>;
}
