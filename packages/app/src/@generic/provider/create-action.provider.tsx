import { ReactNode, useState } from 'react';

import { CreateActionContext } from '../context/create-action.context';
import { CreateActionInterface } from '../interface/create-action.interface';

interface Props {
    readonly children: ReactNode;
}

export const CreateActionProvider = ({ children }: Props) => {
    const [createAction, setCreateAction] = useState<CreateActionInterface | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const openMenu = () => void setIsMenuOpen(true);

    const value = { createAction, setCreateAction, isMenuOpen, openMenu, setIsMenuOpen };

    return <CreateActionContext value={value}>{children}</CreateActionContext>;
};
