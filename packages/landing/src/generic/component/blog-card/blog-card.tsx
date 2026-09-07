import { Trans } from '@lingui/react/macro';
import { Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Badge } from '../../../ui/badge';
import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';
import { BlogCover } from '../blog-cover/blog-cover';
import { Motion } from '../motion/motion';

interface Props {
    slug: string;
    title: string;
    description: string;
    date: string;
    tags: readonly string[];
    locale: string;
    readingTimeMinutes: number;
    index?: number;
}

const whileInView = { opacity: 1, y: 0 };

export const BlogCard = ({ slug, title, description, date, tags, locale, readingTimeMinutes, index = 0 }: Props) => {
    const formattedDate = new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const secondaryTags = tags.slice(1, 4);

    return (
        <Motion index={index} whileInView={whileInView}>
            <Link
                className="group block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                href={`/${locale}/blog/${slug}`}
            >
                <Card className="h-full overflow-hidden transition duration-300 ease-out group-hover:border-primary/40 group-hover:shadow-lg motion-safe:group-hover:-translate-y-1">
                    <div className="aspect-16/10 overflow-hidden">
                        <BlogCover slug={slug} tags={tags} />
                    </div>

                    <CardContent className="p-6 pt-6">
                        <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>

                        <p className="text-muted-foreground mb-4 line-clamp-3">{description}</p>

                        {isNotEmptyArray(secondaryTags) && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {secondaryTags.map(tag => (
                                    <Badge key={tag} className="text-xs" variant="secondary">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="size-4" />

                                <span>{formattedDate}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <Clock className="size-4" />

                                <Trans>{readingTimeMinutes} min read</Trans>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </Motion>
    );
};
