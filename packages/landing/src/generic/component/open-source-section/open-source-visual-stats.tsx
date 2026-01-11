import { Trans } from '@lingui/react/macro';
import { GitFork, Star, Users } from 'lucide-react';

import { OpenSourceVisualStat } from './open-source-visual-stat';

export const OpenSourceVisualStats = () => (
    <div className="grid grid-cols-3 gap-4">
        <OpenSourceVisualStat icon={<Star className="size-4 text-yellow-400" />} label={<Trans>Stars</Trans>} value="2.4k" />

        <OpenSourceVisualStat icon={<GitFork className="size-4 text-blue-400" />} label={<Trans>Forks</Trans>} value="180" />

        <OpenSourceVisualStat icon={<Users className="size-4 text-green-400" />} label={<Trans>Contributors</Trans>} value="45" />
    </div>
);
