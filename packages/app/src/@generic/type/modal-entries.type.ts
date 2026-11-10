import type { ModalParams } from './modal-params.type';
import type { ModalResult } from './modal-result.type';
import type { ModalRoute } from './modal-route.type';

export type ModalEntries<TRoutes extends ModalRoute = ModalRoute> = {
    [TRoute in TRoutes]?: {
        readonly params: ModalParams<TRoute> | null;
        readonly onResult: (result: ModalResult<TRoute> | null) => void;
    } | null;
};
