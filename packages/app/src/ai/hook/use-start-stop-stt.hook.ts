import { useEffect } from 'react';

import { sttService } from '../service/stt.service';

export const useStartStopStt = (): void => {
    useEffect(() => {
        void sttService.start();

        return () => {
            void sttService.stop();
        };
    }, []);
};
