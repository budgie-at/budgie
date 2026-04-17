import { ReactNode, useEffect } from 'react';

import { aiCoordinatorService } from '../service/ai-coordinator.service';
import { aiLog } from '../utils/ai-log.util';

interface Props {
    readonly children: ReactNode;
}

export const AiProvider = ({ children }: Props) => {
    useEffect(() => {
        aiLog('provider:mount');
        aiCoordinatorService.start();

        return () => {
            aiLog('provider:unmount');
            aiCoordinatorService.stop();
        };
    }, []);

    return <>{children}</>;
};
