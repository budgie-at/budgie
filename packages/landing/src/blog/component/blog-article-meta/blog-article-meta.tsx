import { Trans } from '@lingui/react/macro';
import { Calendar, Clock } from 'lucide-react';

import type { ReactNode } from 'react';

interface Props {
    date: string;
    author: string;
    locale: string;
    readingTimeMinutes: number;
    tags: ReactNode;
}

export const BlogArticleMeta = ({ date, author, locale, readingTimeMinutes, tags }: Props) => {
    const formattedDate = new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="border-b pb-6 space-y-4">
            <div className="flex flex-wrap gap-2">{tags}</div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Calendar className="size-4" />

                    <span>{formattedDate}</span>
                </div>

                <div className="flex items-center gap-1">
                    <Clock className="size-4" />

                    <span>
                        {readingTimeMinutes} <Trans>min read</Trans>
                    </span>
                </div>

                <div>
                    <Trans>By</Trans> {author}
                </div>
            </div>
        </div>
    );
};
