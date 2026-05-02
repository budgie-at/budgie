export const InteractionManager = {
    runAfterInteractions(cb: () => void): { cancel: () => void } {
        cb();
        return { cancel: () => undefined };
    }
};
