/* eslint-disable lingui/no-unlocalized-strings */
import { INDEXNOW_ENDPOINT, INDEXNOW_HOST, INDEXNOW_KEY } from '../constant/indexnow.constant';
import { BASE_URL } from '../constant/seo.constant';
import { buildSiteUrls } from '../util/build-site-urls.util';

class IndexnowSubmitterService {
    async submit(): Promise<{ status: number; count: number }> {
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

        return { status: response.status, count: urlList.length };
    }
}

export const indexnowSubmitter = new IndexnowSubmitterService();
