/* oxlint-disable lingui/no-unlocalized-strings */
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientRequest from 'effect/http/HttpClientRequest';

import { isNotEmptyString } from '@rnw-community/shared';

import { INDEXNOW_ENDPOINT, INDEXNOW_HOST, INDEXNOW_KEY } from '../constant/indexnow.constant';
import { BASE_URL } from '../constant/seo.constant';
import { buildSiteUrls } from '../util/build-site-urls.util';

import type { IndexnowSubmitResultInterface } from '../interface/indexnow-submit-result.interface';

class IndexnowSubmitterService {
    readonly submit = Effect.fn('IndexnowSubmitterService.submit')(function* () {
        const urlList = buildSiteUrls();
        const request = HttpClientRequest.post(INDEXNOW_ENDPOINT).pipe(
            HttpClientRequest.bodyJsonUnsafe({
                host: INDEXNOW_HOST,
                key: INDEXNOW_KEY,
                keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
                urlList
            })
        );
        const response = yield* HttpClient.execute(request);
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
    });
}

export const indexnowSubmitter = new IndexnowSubmitterService();
