import { Trans } from '@lingui/react/macro';
import { CheckCircle2, CloudOff, EyeOff, Lock, Smartphone } from 'lucide-react';

import { ProblemSolutionItem } from './problem-solution-item';

export const SolutionItems = () => (
    <>
        <ProblemSolutionItem
            icon={<Smartphone className="size-4" />}
            text={<Trans>Data stays on YOUR device only</Trans>}
            variant="solution"
        />
        <ProblemSolutionItem
            icon={<EyeOff className="size-4" />}
            text={<Trans>We literally cannot see your data</Trans>}
            variant="solution"
        />
        <ProblemSolutionItem
            icon={<Lock className="size-4" />}
            text={<Trans>Locked behind biometrics. Encrypted with SQLCipher AES-256.</Trans>}
            variant="solution"
        />
        <ProblemSolutionItem
            icon={<CloudOff className="size-4" />}
            text={<Trans>Works 100% offline—always fast</Trans>}
            variant="solution"
        />
        <ProblemSolutionItem
            icon={<CheckCircle2 className="size-4" />}
            text={<Trans>Open source—audit our code</Trans>}
            variant="solution"
        />
    </>
);
