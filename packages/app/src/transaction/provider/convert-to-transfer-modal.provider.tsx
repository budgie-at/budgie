import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import { ConvertToTransferModalContext, ConvertToTransferModalParams } from '../context/convert-to-transfer-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const ConvertToTransferModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<ConvertToTransferModalParams, boolean>('/convert-to-transfer');

    const value = { openConvertToTransfer: open, resolveConvertToTransfer: resolve, currentParams };

    return <ConvertToTransferModalContext value={value}>{children}</ConvertToTransferModalContext>;
};
