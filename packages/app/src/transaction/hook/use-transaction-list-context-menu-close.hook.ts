import { useRef } from 'react';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import type { TransactionListContextMenuCloseParamsInterface } from '../interface/transaction-list-context-menu-close-params.interface';

export const useTransactionListContextMenuClose = ({
    isOpen,
    onClose,
    onCloseComplete
}: TransactionListContextMenuCloseParamsInterface) => {
    const pendingActionRef = useRef<EmptyFn | null>(null);

    const closeMenu = (afterClose?: EmptyFn) => {
        if (!isOpen) {
            return;
        }

        pendingActionRef.current = afterClose ?? null;
        onClose();
    };

    const handleCloseComplete = () => {
        if (isDefined(pendingActionRef.current)) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }

        onCloseComplete();
    };

    return { closeMenu, handleCloseComplete };
};
