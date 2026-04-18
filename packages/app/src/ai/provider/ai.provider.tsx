import { ReactNode, useEffect } from 'react';

import { aiCoordinatorService } from '../service/ai-coordinator.service';
import { aiSystemStatusService } from '../service/ai-system-status.service';
import { aiLog } from '../utils/ai-log.util';

interface Props {
    readonly children: ReactNode;
}

export const AiProvider = ({ children }: Props) => {
    useEffect(() => {
        aiLog('provider:mount');
        aiCoordinatorService.start();
        aiSystemStatusService.start();

        return () => {
            aiLog('provider:unmount');
            aiSystemStatusService.stop();
            aiCoordinatorService.stop();
        };
    }, []);

    return <>{children}</>;
};
