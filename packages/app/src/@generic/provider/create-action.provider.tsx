import { ReactNode, useCallback, useMemo, useState } from 'react';

import { CreateActionContext } from '../context/create-action.context';
import { CreateActionInterface } from '../interface/create-action.interface';

interface Props {
    readonly children: ReactNode;
}

export const CreateActionProvider = ({ children }: Props) => {
    const [createAction, setCreateAction] = useState<CreateActionInterface | null>(null);
    const [accountId, setAccountId] = useState<number | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const openMenu = useCallback(() => void setIsMenuOpen(true), []);

    const value = useMemo(
        () => ({ createAction, setCreateAction, accountId, setAccountId, isMenuOpen, openMenu, setIsMenuOpen }),
        [createAction, accountId, isMenuOpen, openMenu]
    );

    return <CreateActionContext value={value}>{children}</CreateActionContext>;
};
