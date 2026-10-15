import { Trans } from '@lingui/react/macro';
import { GitBranch } from 'lucide-react';

import { Button } from '../../../ui/button';

const SOURCE_REPOSITORY_URL = 'https://github.com/budgie-at/budgie';

export const FeatureProofSource = () => (
    <Button asChild className="feature-proof-action rounded-full" size="lg">
        <a href={SOURCE_REPOSITORY_URL} rel="noopener noreferrer" target="_blank">
            <GitBranch aria-hidden />
            <Trans>Read the source</Trans>
        </a>
    </Button>
);
