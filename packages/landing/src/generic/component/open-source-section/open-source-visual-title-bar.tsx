import { Trans } from '@lingui/react/macro';

export const OpenSourceVisualTitleBar = () => (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
        <div className="size-3 rounded-full bg-red-500" />
        <div className="size-3 rounded-full bg-yellow-500" />
        <div className="size-3 rounded-full bg-green-500" />

        <span className="ml-2 text-sm text-gray-400">
            <Trans>budgie-at/budgie</Trans>
        </span>
    </div>
);
