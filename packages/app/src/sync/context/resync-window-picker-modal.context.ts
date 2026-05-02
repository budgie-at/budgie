import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

export interface ResyncWindowPickerModalParams {
    readonly accountId: number;
}

export const [ResyncWindowPickerModalContext, useResyncWindowPickerModal] = createModalContext<ResyncWindowPickerModalParams, null>(null);
