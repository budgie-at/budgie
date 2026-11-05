import { useState } from 'react';

import { useCurrentConvertToTransferModalParams } from '../context/convert-to-transfer-modal.context';

export const useConvertToTransferModalParams = () => {
    const currentParams = useCurrentConvertToTransferModalParams();
    const [params] = useState(currentParams);

    return params;
};
