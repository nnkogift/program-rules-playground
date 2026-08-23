import type { RulesPanelProps } from '@nnkogift/dhis2-form-utils-devtools'
import { lazy, Suspense } from 'react'
import { RulesPanelFallback } from './RulesPanelFallback'

const RulesPanel = lazy(() =>
    import('@nnkogift/dhis2-form-utils-devtools').then((module) => ({
        default: module.RulesPanel,
    }))
)

export function LazyRulesPanel(props: RulesPanelProps) {
    return (
        <Suspense fallback={<RulesPanelFallback />}>
            <RulesPanel {...props} />
        </Suspense>
    )
}
