import type { File } from 'expo-file-system';

export const deleteIfExists = (file: File): void => {
    if (file.exists) {
        file.delete();
    }
};
