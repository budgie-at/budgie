export const toNativePath = (uri: string): string => decodeURIComponent(uri.replace(/^file:\/\//u, ''));
