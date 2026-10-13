import { useState } from 'react';

export const useToday = (): Date => {
    const [today] = useState(() => new Date());

    return today;
};
