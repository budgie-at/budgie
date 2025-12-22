export const microPause = () =>
    new Promise(resolve => {
        setTimeout(resolve, 0);
    });
