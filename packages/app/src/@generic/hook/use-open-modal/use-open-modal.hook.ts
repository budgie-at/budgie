import { use } from 'react';

import { ModalContext } from '../../context/modal.context';

import type { ModalParams } from '../../type/modal-params.type';
import type { ModalResult } from '../../type/modal-result.type';
import type { ModalRoute } from '../../type/modal-route.type';

const openOutsideProvider = <TRoute extends ModalRoute>(
    _params?: ModalParams<TRoute>,
    onResult?: (result: ModalResult<TRoute> | null) => void
) => {
    onResult?.(null);
};

export const useOpenModal = <TRoute extends ModalRoute>(route: TRoute) => use(ModalContext)?.opener(route) ?? openOutsideProvider;
