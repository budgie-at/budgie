import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { atmCashWithdrawalConsolidationService } from './consolidation-rule/atm-cash-withdrawal-consolidation.service';
import { existingTransferBridgeConsolidationService } from './consolidation-rule/existing-transfer-bridge-consolidation.service';
import { existingTransferIncomeDuplicateConsolidationService } from './consolidation-rule/existing-transfer-income-duplicate-consolidation.service';
import { ibanBridgeCanonicalDuplicateConsolidationService } from './consolidation-rule/iban-bridge-canonical-duplicate-consolidation.service';
import { ibanBridgeChainTransferConsolidationService } from './consolidation-rule/iban-bridge-chain-transfer-consolidation.service';
import { ibanBridgeTransferConsolidationService } from './consolidation-rule/iban-bridge-transfer-consolidation.service';
import { refundConsolidationService } from './consolidation-rule/refund-consolidation.service';
import { transferPairConsolidationService } from './consolidation-rule/transfer-pair-consolidation.service';
import { ConsolidationRuleRunnerService } from './consolidation-rule-runner.service';

import type { ConsolidationRuleRunnerInterface } from '../interface/consolidation-rule-runner.interface';

class ConsolidationRuleRegistryService {
    private static readonly RUNNERS: ConsolidationRuleRunnerInterface[] = [
        new ConsolidationRuleRunnerService(ibanBridgeChainTransferConsolidationService),
        new ConsolidationRuleRunnerService(existingTransferBridgeConsolidationService),
        new ConsolidationRuleRunnerService(ibanBridgeCanonicalDuplicateConsolidationService),
        new ConsolidationRuleRunnerService(ibanBridgeTransferConsolidationService),
        new ConsolidationRuleRunnerService(existingTransferIncomeDuplicateConsolidationService),
        new ConsolidationRuleRunnerService(transferPairConsolidationService),
        new ConsolidationRuleRunnerService(atmCashWithdrawalConsolidationService),
        new ConsolidationRuleRunnerService(refundConsolidationService)
    ];

    @Log(
        'enter',
        result => `done ruleOrder=${result.map(rule => `${rule.type}:${rule.priority}`).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    getRunners(): ConsolidationRuleRunnerInterface[] {
        return [...ConsolidationRuleRegistryService.RUNNERS].sort((leftRunner, rightRunner) => leftRunner.priority - rightRunner.priority);
    }
}

export const consolidationRuleRegistryService = new ConsolidationRuleRegistryService();
