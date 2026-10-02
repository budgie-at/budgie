import * as Effect from 'effect/Effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';

import { isDefined } from '@rnw-community/shared';

import { iosDevReleaseFetchApi } from '../../util/ios-dev-release-fetch.util';
import { BetaEmptyState } from '../beta-empty-state/beta-empty-state';
import { BetaReleaseCard } from '../beta-release-card/beta-release-card';

interface Props {
    readonly locale: string;
}

export const BetaReleaseSection = async ({ locale }: Props) => {
    const release = await Effect.runPromise(
        iosDevReleaseFetchApi({ next: { revalidate: 600 } }).pipe(Effect.provide(FetchHttpClient.layer))
    );

    return isDefined(release) ? (
        <BetaReleaseCard locale={locale} publishedAt={release.published_at} releaseName={release.name} releaseNotes={release.body} />
    ) : (
        <BetaEmptyState />
    );
};
