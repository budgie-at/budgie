import { useState } from 'react';

import type { CategorizeInboxLabelInterface } from '../interface/categorize-inbox-label.interface';

export const useCategorizeInboxLabels = (labels: CategorizeInboxLabelInterface[]): ReadonlyMap<number, CategorizeInboxLabelInterface> => {
    const signature = labels.map(label => `${label.id}:${label.icon}:${label.title}`).join('|');
    const labelsById = new Map(labels.map(label => [label.id, label]));
    const [snapshot, setSnapshot] = useState({ signature, labelsById });

    if (snapshot.signature !== signature) {
        setSnapshot({ signature, labelsById });
    }

    return snapshot.labelsById;
};
