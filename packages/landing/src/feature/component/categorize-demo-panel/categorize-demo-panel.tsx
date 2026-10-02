import { CheckCheck } from 'lucide-react';

import type { ReactNode } from 'react';

interface Props {
    readonly progress: ReactNode;
    readonly done: ReactNode;
    readonly undo: ReactNode;
    readonly children: ReactNode;
}

export const CategorizeDemoPanel = ({ progress, done, undo, children }: Props) => (
    <div className="cdemo-panel">
        <p className="cdemo-subtitle">{progress}</p>
        <div className="cdemo-progress">
            <span className="cdemo-progress-bar" data-cdemo-progress />
        </div>
        <div className="cdemo-slot">
            <span className="cdemo-accept">
                <CheckCheck size={16} />
                {children}
            </span>
            <span className="cdemo-undo">
                <CheckCheck size={16} />
                <span className="cdemo-undo-title">{done}</span>
                <span className="cdemo-undo-action">{undo}</span>
            </span>
        </div>
    </div>
);
