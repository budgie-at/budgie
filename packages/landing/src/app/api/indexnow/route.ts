/* oxlint-disable lingui/no-unlocalized-strings */
import * as Effect from 'effect/Effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import { NextResponse } from 'next/server';

import { isNotEmptyString } from '@rnw-community/shared';

import { indexnowSubmitter } from '../../../generic/service/indexnow-submitter.service';

// eslint-disable-next-line func-style -- Next.js route handlers must be exported functions
export async function POST(request: Request): Promise<NextResponse> {
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET;

    if (!isNotEmptyString(adminSecret)) {
        return NextResponse.json({ error: 'IndexNow admin secret is not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${adminSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await Effect.runPromise(indexnowSubmitter.submit().pipe(Effect.provide(FetchHttpClient.layer)));

    return NextResponse.json(result, { status: result.status });
}
