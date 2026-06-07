import { AtmCashWithdrawalConsolidationFamilyService } from './atm-cash-withdrawal-consolidation-family.service';
import { ExistingTransferBridgeConsolidationFamilyService } from './existing-transfer-bridge-consolidation-family.service';
import { ExistingTransferChainReclaimConsolidationFamilyService } from './existing-transfer-chain-reclaim-consolidation-family.service';
import { ExistingTransferIncomeDuplicateConsolidationFamilyService } from './existing-transfer-income-duplicate-consolidation-family.service';
import { IbanBridgeCanonicalDuplicateConsolidationFamilyService } from './iban-bridge-canonical-duplicate-consolidation-family.service';
import { IbanBridgeChainTransferConsolidationFamilyService } from './iban-bridge-chain-transfer-consolidation-family.service';
import { IbanBridgeTransferConsolidationFamilyService } from './iban-bridge-transfer-consolidation-family.service';
import { RefundPairConsolidationFamilyService } from './refund-pair-consolidation-family.service';
import { TransferPairConsolidationFamilyService } from './transfer-pair-consolidation-family.service';

import type { ConsolidationExecutorService } from '../../executor/service/consolidation-executor.service';
import type { ConsolidationRepairExecutorService } from '../../executor/service/consolidation-repair-executor.service';
import type { ConsolidationFamilyStrategyInterface } from '../interface/consolidation-family-strategy.interface';
import type { ConsolidationRepositoriesInterface } from '../interface/consolidation-repositories.interface';

export class ConsolidationFamilyRegistryService {
    constructor(
        private readonly repositories: ConsolidationRepositoriesInterface,
        private readonly consolidationExecutorService: ConsolidationExecutorService,
        private readonly consolidationRepairExecutorService: ConsolidationRepairExecutorService,
        private readonly yieldControl: () => Promise<void>
    ) {}

    buildFamilies(): ConsolidationFamilyStrategyInterface[] {
        return [
            new IbanBridgeChainTransferConsolidationFamilyService(
                this.repositories.ibanBridgeTransferRepository,
                this.consolidationExecutorService,
                this.yieldControl
            ),
            new ExistingTransferBridgeConsolidationFamilyService(
                this.repositories.existingTransferRepository,
                this.consolidationExecutorService,
                this.yieldControl
            ),
            new ExistingTransferChainReclaimConsolidationFamilyService(
                this.repositories.existingTransferRepository,
                this.consolidationRepairExecutorService,
                this.yieldControl
            ),
            new IbanBridgeCanonicalDuplicateConsolidationFamilyService(
                this.repositories.ibanBridgeTransferRepository,
                this.consolidationRepairExecutorService,
                this.yieldControl
            ),
            new IbanBridgeTransferConsolidationFamilyService(
                this.repositories.ibanBridgeTransferRepository,
                this.consolidationExecutorService,
                this.yieldControl
            ),
            new ExistingTransferIncomeDuplicateConsolidationFamilyService(
                this.repositories.existingTransferRepository,
                this.consolidationRepairExecutorService,
                this.yieldControl
            ),
            new TransferPairConsolidationFamilyService(
                this.repositories.transferPairRepository,
                this.consolidationExecutorService,
                this.yieldControl
            ),
            new AtmCashWithdrawalConsolidationFamilyService(
                this.repositories.atmCashWithdrawalRepository,
                this.consolidationExecutorService,
                this.yieldControl
            ),
            new RefundPairConsolidationFamilyService(
                this.repositories.refundPairRepository,
                this.consolidationRepairExecutorService,
                this.yieldControl
            )
        ];
    }

    buildExistingTransferIncomeDuplicateFamily(): ExistingTransferIncomeDuplicateConsolidationFamilyService {
        return new ExistingTransferIncomeDuplicateConsolidationFamilyService(
            this.repositories.existingTransferRepository,
            this.consolidationRepairExecutorService,
            this.yieldControl
        );
    }
}
