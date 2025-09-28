import { ArrowRight, Github, Smartphone } from 'lucide-react';

import { Button } from '../ui/button';

export const HeroButtons = () => (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button className="rounded-full h-12 px-8 text-base" size="lg">
            <Smartphone className="mr-2 size-4" />
            Join Whitelist
            <ArrowRight className="ml-2 size-4" />
        </Button>

        <Button className="rounded-full h-12 px-8 text-base bg-transparent" size="lg" variant="outline">
            <Github className="mr-2 size-4" />
            View Source Code
        </Button>
    </div>
);
