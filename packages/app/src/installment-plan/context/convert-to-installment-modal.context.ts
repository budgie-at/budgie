import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

import type { ConvertToInstallmentModalParamsInterface } from '../interface/convert-to-installment-modal-params.interface';

export const [ConvertToInstallmentModalContext, useConvertToInstallmentModal, useConvertToInstallmentModalParams] = createModalContext<
    ConvertToInstallmentModalParamsInterface,
    number | null
>(null);
