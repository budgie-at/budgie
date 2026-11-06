import { use } from 'react';
import { View } from 'react-native';

import { TransactionKeypadContext } from '../../context/transaction-keypad.context';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const TransactionSecondaryFields = ({ children }: Props) => {
    const { isExpanded } = use(TransactionKeypadContext);
    const style = { display: isExpanded ? 'none' : 'flex' } as const;

    return <View style={style}>{children}</View>;
};
