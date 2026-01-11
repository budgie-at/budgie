import { Trans } from '@lingui/react/macro';
import { AlertTriangle, Eye, Lock, Server, X } from 'lucide-react';

import { ProblemSolutionItem } from './problem-solution-item';

export const ProblemItems = () => (
    <>
        <ProblemSolutionItem
            icon={<Server className="size-4" />}
            text={<Trans>Your data stored on their servers</Trans>}
            variant="problem"
        />
        <ProblemSolutionItem
            icon={<Eye className="size-4" />}
            text={<Trans>Companies can see your transactions</Trans>}
            variant="problem"
        />
        <ProblemSolutionItem
            icon={<AlertTriangle className="size-4" />}
            text={<Trans>Vulnerable to data breaches</Trans>}
            variant="problem"
        />
        <ProblemSolutionItem icon={<X className="size-4" />} text={<Trans>Requires internet connection</Trans>} variant="problem" />
        <ProblemSolutionItem icon={<Lock className="size-4" />} text={<Trans>Closed source—trust blindly</Trans>} variant="problem" />
    </>
);
