import { ReactNode } from 'react';

import { useModalResolver } from '../../@generic/hook/use-modal-resolver/use-modal-resolver.hook';
import {
    ImportColumnMapperModalContext,
    ImportColumnMapperModalParams,
    ImportColumnMapperResult
} from '../context/import-column-mapper-modal.context';

interface Props {
    readonly children: ReactNode;
}

export const ImportColumnMapperModalProvider = ({ children }: Props) => {
    const { currentParams, open, resolve } = useModalResolver<ImportColumnMapperModalParams, ImportColumnMapperResult>(
        '/import-column-mapper'
    );

    const value = { openImportColumnMapper: open, resolveImportColumnMapper: resolve, currentParams };

    return <ImportColumnMapperModalContext value={value}>{children}</ImportColumnMapperModalContext>;
};
