import { File } from 'expo-file-system';

export const readFileAsUint8Array = async (uri: string): Promise<Uint8Array> => {
    const file = new File(uri);
    const buffer = await file.arrayBuffer();

    return new Uint8Array(buffer);
};
