/* oxlint-disable lingui/no-unlocalized-strings */
import * as Effect from 'effect/Effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import { NextResponse } from 'next/server';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { IndexnowSubmitter } from '../../../generic/service/indexnow-submitter.service';

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

    const sinceParam = new URL(request.url).searchParams.get('since');
    const since = isNotEmptyString(sinceParam) ? new Date(sinceParam) : null;

    if (isDefined(since) && Number.isNaN(since.getTime())) {
        return NextResponse.json({ error: 'Invalid since: expected an ISO date-time' }, { status: 400 });
    }

    const result = await Effect.runPromise(
        Effect.flatMap(IndexnowSubmitter, submitter => submitter.submit(since)).pipe(
            Effect.provide(IndexnowSubmitter.layer.pipe(Layer.provide(FetchHttpClient.layer)))
        )
    );

    return NextResponse.json(result, { status: result.status });
}
