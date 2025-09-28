import { Star } from 'lucide-react';

import { Card } from '../ui/card/card';
import { CardContent } from '../ui/card/card-content';

interface TestimonialsCardProps {
    readonly rating: number;
    readonly author: string;
    readonly quote: string;
    readonly role: string;
}

export const TestimonialsCard = ({ rating, quote, author, role }: TestimonialsCardProps) => (
    <Card className="h-full overflow-hidden border-border/40 bg-linear-to-b from-background to-muted/10 backdrop-blur-sm transition-all hover:shadow-md">
        <CardContent className="p-6 flex flex-col h-full">
            <div className="flex mb-4">
                {Array.from({ length: rating }, (_, number) => number).map(number => (
                    <Star className="size-4 text-yellow-500 fill-yellow-500" key={number} />
                ))}
            </div>

            <p className="text-lg mb-6 grow">{quote}</p>

            <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border/40">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center text-foreground font-medium">
                    {author.charAt(0)}
                </div>

                <div>
                    <p className="font-medium">{author}</p>

                    <p className="text-sm text-muted-foreground">{role}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);
