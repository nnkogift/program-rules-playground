import { createContext, type ReactNode, useContext, useMemo } from 'react'
import type { DevtoolsLabelLookup } from '@nnkogift/dhis2-form-utils-devtools'

type RuleDisplayContextValue = {
    ghostsEnabled: boolean
    labelLookup: DevtoolsLabelLookup
}

const RuleDisplayContext = createContext<RuleDisplayContextValue | null>(null)

type RuleDisplayProviderProps = RuleDisplayContextValue & {
    children: ReactNode
}

export function RuleDisplayProvider({
    ghostsEnabled,
    labelLookup,
    children,
}: RuleDisplayProviderProps) {
    const value = useMemo(
        () => ({ ghostsEnabled, labelLookup }),
        [ghostsEnabled, labelLookup]
    )
    return (
        <RuleDisplayContext.Provider value={value}>
            {children}
        </RuleDisplayContext.Provider>
    )
}

export function useRuleDisplay(): RuleDisplayContextValue {
    const ctx = useContext(RuleDisplayContext)
    if (!ctx) {
        throw new Error(
            'useRuleDisplay must be used inside RuleDisplayProvider'
        )
    }
    return ctx
}
