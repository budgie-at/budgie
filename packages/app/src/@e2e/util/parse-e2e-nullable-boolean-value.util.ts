export const parseE2ENullableBooleanValue = (value: unknown) => {
    if (value === true || value === 'true') {
        return true;
    }

    if (value === false || value === 'false') {
        return false;
    }

    return null;
};
