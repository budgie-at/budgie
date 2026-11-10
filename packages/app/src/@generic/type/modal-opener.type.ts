import type { ModalParams } from './modal-params.type';
import type { ModalResult } from './modal-result.type';
import type { ModalRoute } from './modal-route.type';

export type ModalOpener<TRoute extends ModalRoute> = (
    params?: ModalParams<TRoute>,
    onResult?: (result: ModalResult<TRoute> | null) => void
) => void;
