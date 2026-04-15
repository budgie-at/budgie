import { useLingui } from '@lingui/react/macro';
import { Calendar, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '../../../ui/badge';
import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';
import { Motion } from '../motion/motion';

interface Props {
    slug: string;
    title: string;
    description: string;
    date: string;
    tags: readonly string[];
    image?: string;
    locale: string;
    readingTimeMinutes: number;
    index?: number;
}

const whileInView = { opacity: 1, y: 0 };

export const BlogCard = ({ slug, title, description, date, tags, image, locale, readingTimeMinutes, index = 0 }: Props) => {
    const { t } = useLingui();

    const formattedDate = new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <Motion index={index} whileInView={whileInView}>
            <Link className="block h-full" href={`/${locale}/blog/${slug}`}>
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                    {image && (
                        <div className="relative h-48 overflow-hidden">
                            <Image
                                alt={title}
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                src={image}
                            />
                        </div>
                    )}

                    <CardContent className="p-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {tags.slice(0, 3).map(tag => (
                                <Badge key={tag} className="text-xs" variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>

                        <p className="text-muted-foreground mb-4 line-clamp-3">{description}</p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="size-4" />

                                <span>{formattedDate}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <Clock className="size-4" />

                                <span>
                                    {readingTimeMinutes} {t`min read`}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </Motion>
    );
};
