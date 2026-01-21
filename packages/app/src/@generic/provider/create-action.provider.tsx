import { ReactNode, useMemo, useState } from 'react';

import { CreateActionContext } from '../context/create-action.context';
import { CreateActionInterface } from '../interface/create-action.interface';

interface Props {
    readonly children: ReactNode;
}

export const CreateActionProvider = ({ children }: Props) => {
    const [createAction, setCreateAction] = useState<CreateActionInterface | null>(null);

    const value = useMemo(() => ({ createAction, setCreateAction }), [createAction]);

    return <CreateActionContext value={value}>{children}</CreateActionContext>;
};
