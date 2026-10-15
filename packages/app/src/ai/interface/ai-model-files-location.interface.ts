import type { Directory, File } from 'expo-file-system';

export interface AiModelFilesLocationInterface {
    readonly directory: Directory;
    readonly modelFile: File;
    readonly tempFile: File;
    readonly sizeFile: File;
}
