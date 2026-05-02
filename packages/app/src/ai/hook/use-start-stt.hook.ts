import { useEffect } from 'react';

import { sttService } from '../service/stt.service';

export const useStartStt = (): void => {
    useEffect(() => {
        void sttService.start();
    }, []);
};
