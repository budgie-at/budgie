export const secrets = new Map<string, string>();

export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 0;

export const getItemAsync = (key: string) => Promise.resolve(secrets.get(key) ?? null);

export const setItemAsync = (key: string, value: string) => Promise.resolve(void secrets.set(key, value));

export const deleteItemAsync = (key: string) => Promise.resolve(void secrets.delete(key));
