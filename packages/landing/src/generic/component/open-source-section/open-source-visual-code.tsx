import { Trans } from '@lingui/react/macro';

export const OpenSourceVisualCode = () => (
    <div className="p-4 rounded-lg bg-gray-800/50 font-mono text-sm">
        <pre className="text-green-400 whitespace-pre-wrap">
            {/* eslint-disable-next-line lingui/no-unlocalized-strings -- Terminal command, not translatable */}
            <code>$ git clone https://github.com/budgie-at/budgie</code>
        </pre>

        <div className="text-gray-400 mt-2">
            <Trans># Audit the code yourself</Trans>
        </div>
    </div>
);
