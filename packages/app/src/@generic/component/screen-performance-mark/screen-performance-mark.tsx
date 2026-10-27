import { useEffect } from 'react';

interface Props {
    readonly routeName: string;
}

export const ScreenPerformanceMark = ({ routeName }: Props) => {
    useEffect(() => {
        performance.mark(`budgie:screen:${routeName}`);
    }, [routeName]);

    return null;
};
