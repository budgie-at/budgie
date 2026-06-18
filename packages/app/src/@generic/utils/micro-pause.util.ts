export const microPause = (delay = 0): Promise<void> =>
    new Promise<void>(resolve => {
        setTimeout(resolve, delay);
    });
