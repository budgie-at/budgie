import { DATABASE_DIRECTORY } from './database-directory.constant';

export const DATABASE_LOCATION = decodeURIComponent(DATABASE_DIRECTORY.uri.replace(/^file:\/\//u, '')).replace(/\/$/u, '');
