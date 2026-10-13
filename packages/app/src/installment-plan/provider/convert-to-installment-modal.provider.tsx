import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { ConvertToInstallmentModalContext } from '../context/convert-to-installment-modal.context';

import type { ConvertToInstallmentModalParamsInterface } from '../interface/convert-to-installment-modal-params.interface';

export const ConvertToInstallmentModalProvider = createModalProvider<ConvertToInstallmentModalParamsInterface, number | null>(
    ConvertToInstallmentModalContext,
    '/convert-to-installment'
);
