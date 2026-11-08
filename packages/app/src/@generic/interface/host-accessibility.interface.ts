import type { Dispatch, SetStateAction } from 'react';

export interface HostAccessibilityInterface {
    readonly layers: readonly string[];
    readonly setLayers: Dispatch<SetStateAction<readonly string[]>>;
}
