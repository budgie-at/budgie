import { ReactNode, useState } from 'react';

import { CreateActionContext } from '../context/create-action.context';
import { CreateActionInterface } from '../interface/create-action.interface';

interface Props {
    readonly children: ReactNode;
}

export const CreateActionProvider = ({ children }: Props) => {
    const [createAction, setCreateAction] = useState<CreateActionInterface | null>(null);

    const value = { createAction, setCreateAction };

    return <CreateActionContext.Provider value={value}>{children}</CreateActionContext.Provider>;
};
