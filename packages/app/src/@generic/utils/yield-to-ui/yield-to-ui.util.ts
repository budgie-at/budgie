export const yieldToUI = (): Promise<void> =>
    new Promise(resolve => {
        setTimeout(resolve, 0);
    });
