import { Trans } from '@lingui/react/macro';
import { Github } from 'lucide-react';

export const OpenSourceVisualHeader = () => (
    <div className="flex items-center gap-4">
        <div className="size-16 rounded-xl bg-primary/20 flex items-center justify-center">
            <Github className="size-8" />
        </div>

        <div>
            <h4 className="text-xl font-bold">
                <Trans>Budgie</Trans>
            </h4>

            <p className="text-gray-400 text-sm">
                <Trans>Offline-first budgeting app</Trans>
            </p>
        </div>
    </div>
);
