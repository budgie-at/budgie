import { File } from 'expo-file-system';

export const readFileAsArrayBuffer = async (uri: string): Promise<ArrayBuffer> => {
    const file = new File(uri);

    return file.arrayBuffer();
};
