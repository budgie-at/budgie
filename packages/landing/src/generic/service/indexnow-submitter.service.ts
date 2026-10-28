import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientRequest from 'effect/http/HttpClientRequest';
import * as Layer from 'effect/Layer';

import { isNotEmptyString } from '@rnw-community/shared';

import { INDEXNOW_ENDPOINT, INDEXNOW_HOST, INDEXNOW_KEY } from '../constant/indexnow.constant';
import { BASE_URL } from '../constant/seo.constant';
import { buildSiteUrls } from '../utils/build-site-urls.util';

import type { IndexnowSubmitResultInterface } from '../interface/indexnow-submit-result.interface';

export class IndexnowSubmitter extends Context.Service<IndexnowSubmitter>()('@budgie/landing/IndexnowSubmitter', {
    make: Effect.gen(function* () {
        const httpClient = yield* HttpClient.HttpClient;

        return {
            submit: Effect.fn('IndexnowSubmitter.submit')(function* () {
                const urlList = buildSiteUrls();
                const request = HttpClientRequest.post(INDEXNOW_ENDPOINT).pipe(
                    HttpClientRequest.bodyJsonUnsafe({
                        host: INDEXNOW_HOST,
                        key: INDEXNOW_KEY,
                        keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
                        urlList
                    })
                );
                const response = yield* httpClient.execute(request);
                const responseText = yield* response.text;
                const result: IndexnowSubmitResultInterface =
                    response.status >= 200 && response.status < 300
                        ? { status: response.status, count: urlList.length }
                        : {
                              status: response.status,
                              count: urlList.length,
                              ...(isNotEmptyString(responseText) && { error: responseText })
                          };

                return result;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(IndexnowSubmitter, IndexnowSubmitter.make);
}
