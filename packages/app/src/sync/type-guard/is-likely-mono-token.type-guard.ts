const MONO_TOKEN_MIN_LENGTH = 30;
const MONO_TOKEN_PATTERN = /^[a-zA-Z0-9]+$/u;

export const isLikelyMonoToken = (value: string): boolean => {
    const trimmed = value.trim();

    return trimmed.length >= MONO_TOKEN_MIN_LENGTH && MONO_TOKEN_PATTERN.test(trimmed);
};
