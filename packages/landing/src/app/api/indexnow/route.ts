/* eslint-disable lingui/no-unlocalized-strings */
import { NextResponse } from 'next/server';

import { indexnowSubmitter } from '../../../generic/service/indexnow-submitter.service';

// eslint-disable-next-line func-style,no-implicit-globals -- Next.js route handlers must be exported functions
export async function POST(request: Request): Promise<NextResponse> {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await indexnowSubmitter.submit();

    return NextResponse.json(result);
}
