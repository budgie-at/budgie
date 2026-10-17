import { File } from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import { useState } from 'react';

import { DATABASE_DIRECTORY } from '../constant/database-directory.constant';
import { DB_NAME } from '../constant/db-name.constant';

const readFileSize = (fileName: string): number => {
    const file = new File(DATABASE_DIRECTORY, fileName);

    return file.exists ? file.size : 0;
};

const readDatabaseFileSize = (): number => readFileSize(DB_NAME) + readFileSize(`${DB_NAME}-wal`);

export const useDatabaseFileSize = (): number => {
    const [fileSize, setFileSize] = useState(readDatabaseFileSize);

    useFocusEffect(() => {
        setFileSize(readDatabaseFileSize());
    });

    return fileSize;
};
