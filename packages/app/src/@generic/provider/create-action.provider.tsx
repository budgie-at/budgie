import { type ReactNode, useState } from 'react';

import { CreateActionActionsContext, CreateActionContext, CreateMenuOpenContext } from '../context/create-action.context';
import { CreateActionInterface } from '../interface/create-action.interface';

interface Props {
    readonly children: ReactNode;
}

export const CreateActionProvider = ({ children }: Props) => {
    const [createAction, setCreateAction] = useState<CreateActionInterface | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [actions] = useState(() => ({
        setCreateAction,
        openMenu: () => void setIsMenuOpen(true),
        setIsMenuOpen
    }));

    return (
        <CreateActionActionsContext value={actions}>
            <CreateActionContext value={createAction}>
                <CreateMenuOpenContext value={isMenuOpen}>{children}</CreateMenuOpenContext>
            </CreateActionContext>
        </CreateActionActionsContext>
    );
};
