import type { YieldKindEnum } from '@budgie/contracts';
import type { YieldGroupEnum } from '@budgie/market';

export interface YieldKindSectionInterface {
    readonly group: YieldGroupEnum | null;
    readonly kinds: readonly YieldKindEnum[];
}
