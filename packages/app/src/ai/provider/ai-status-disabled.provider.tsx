import { ReactNode } from 'react';

import { AiStatusContext, AiStatusContextInterface } from '../context/ai-status.context';

interface Props {
    readonly children: ReactNode;
}

const disabledValue: AiStatusContextInterface = {
    statusLabel: '',
    brainProgress: 0,
    isRunning: false,
    isLlmReady: false,
    start: () => Promise.resolve(),
    startFresh: () => Promise.resolve()
};

export const AiStatusDisabledProvider = ({ children }: Props) => <AiStatusContext value={disabledValue}>{children}</AiStatusContext>;
