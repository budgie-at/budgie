import { NativeCallError } from '../error/native-call.error';

export const toNativeCallError = (cause: unknown) => new NativeCallError({ cause });
