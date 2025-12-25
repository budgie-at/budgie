export const microPause = (delay = 0) =>
    new Promise(resolve => {
        setTimeout(resolve, delay);
    });
