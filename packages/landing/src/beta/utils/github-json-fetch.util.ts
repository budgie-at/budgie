import * as Effect from 'effect/Effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';
import * as Schema from 'effect/Schema';

export const githubJsonFetch = <Type, Encoded>(url: string, schema: Schema.Codec<Type, Encoded>, requestInit: RequestInit) =>
    HttpClient.get(url).pipe(
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.flatMap(response => response.json),
        Effect.flatMap(Schema.decodeUnknownEffect(schema)),
        Effect.provideService(FetchHttpClient.RequestInit, requestInit),
        Effect.withTracerEnabled(false),
        Effect.orElseSucceed(() => null)
    );
