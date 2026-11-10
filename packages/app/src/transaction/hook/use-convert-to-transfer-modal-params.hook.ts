import { useState } from 'react';

import { useModalParams } from '../../@generic/hook/use-modal-params/use-modal-params.hook';

export const useConvertToTransferModalParams = () => {
    const currentParams = useModalParams('/convert-to-transfer');
    const [params] = useState(currentParams);

    return params;
};
