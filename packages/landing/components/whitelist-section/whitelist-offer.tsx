import { Card } from '../ui/card/card';
import { CardContent } from '../ui/card/card-content';

import { WhitelistOfferBenefits } from './whitelist-offer-benefits';
import { WhitelistOfferDetails } from './whitelist-offer-details';
import { WhitelistOfferFooter } from './whitelist-offer-footer';
import { WhitelistOfferHeader } from './whitelist-offer-header';
import { WhitelistOfferPricing } from './whitelist-offer-pricing';

export const WhitelistOffer = () => (
    <Card className="relative overflow-hidden border-2 border-primary/30 bg-linear-to-br from-background via-background to-primary/5 backdrop-blur-sm shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-linear-to-r from-primary to-secondary text-primary-foreground px-8 py-3 text-sm font-bold rounded-b-xl shadow-lg">
            🎉 EXCLUSIVE WHITELIST OFFER
        </div>

        <CardContent className="p-8 md:p-12">
            <div className="text-center space-y-6">
                <WhitelistOfferHeader />

                <WhitelistOfferPricing />

                <WhitelistOfferBenefits />

                <WhitelistOfferDetails />

                <WhitelistOfferFooter />
            </div>
        </CardContent>
    </Card>
);
