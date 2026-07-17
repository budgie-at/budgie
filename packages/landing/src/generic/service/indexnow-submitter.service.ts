/* oxlint-disable lingui/no-unlocalized-strings */
import { isNotEmptyString } from '@rnw-community/shared';

import { INDEXNOW_ENDPOINT, INDEXNOW_HOST, INDEXNOW_KEY } from '../constant/indexnow.constant';
import { BASE_URL } from '../constant/seo.constant';
import { buildSiteUrls } from '../util/build-site-urls.util';

import type { IndexnowSubmitResultInterface } from '../interface/indexnow-submit-result.interface';

class IndexnowSubmitterService {
    async submit(): Promise<IndexnowSubmitResultInterface> {
        const urlList = buildSiteUrls();

        const response = await fetch(INDEXNOW_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                host: INDEXNOW_HOST,
                key: INDEXNOW_KEY,
                keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
                urlList
            })
        });
        const responseText = await response.text();

        if (!response.ok) {
            return {
                status: response.status,
                count: urlList.length,
                ...(isNotEmptyString(responseText) && { error: responseText })
            };
        }

        return { status: response.status, count: urlList.length };
    }
}

export const indexnowSubmitter = new IndexnowSubmitterService();
