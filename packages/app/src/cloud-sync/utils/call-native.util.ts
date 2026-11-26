import { CloudSyncTransportError, ICloudErrorCode } from '@budgie/cloud-sync';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { NativeCallError } from '../../@generic/error/native-call.error';

const NATIVE_CALL_TIMEOUT_MS = 60_000;
const isNativeError = Schema.is(Schema.Struct({ code: Schema.String, message: Schema.String }));

export const callNative = <A>(run: () => Promise<A>) =>
    Effect.tryPromise({ try: run, catch: cause => NativeCallError.make({ cause }) }).pipe(
        Effect.timeout(NATIVE_CALL_TIMEOUT_MS),
        Effect.catchTags({
            TimeoutError: error =>
                Effect.fail(
                    CloudSyncTransportError.make({
                        code: ICloudErrorCode.NETWORK_UNAVAILABLE,
                        message: error.message
                    })
                ),
            NativeCallError: ({ cause }) =>
                isNativeError(cause)
                    ? Effect.fail(
                          CloudSyncTransportError.make({
                              code: Option.getOrElse(
                                  Schema.decodeUnknownOption(Schema.Enum(ICloudErrorCode))(cause.code),
                                  () => ICloudErrorCode.UNKNOWN
                              ),
                              message: cause.message.split(/\n→ Caused by: /u).pop() ?? cause.message
                          })
                      )
                    : Effect.die(cause)
        })
    );
