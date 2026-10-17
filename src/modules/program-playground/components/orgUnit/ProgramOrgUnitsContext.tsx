import React, { createContext, useCallback, useContext, useMemo } from 'react'
import type { ProgramOrgUnit } from '@/modules/program-playground/schemas/programOrgUnits.schema'

type ProgramOrgUnitsContextValue = {
    orgUnits: ProgramOrgUnit[]
    rootIds: string[]
    /** Called by a form when verify/validate/save is attempted without an org unit. */
    reportMissingOrgUnit: () => void
}

const ProgramOrgUnitsContext = createContext<
    ProgramOrgUnitsContextValue | undefined
>(undefined)

type ProgramOrgUnitsProviderProps = ProgramOrgUnitsContextValue & {
    children: React.ReactNode
}

export function ProgramOrgUnitsProvider({
    orgUnits,
    rootIds,
    reportMissingOrgUnit,
    children,
}: ProgramOrgUnitsProviderProps) {
    const value = useMemo(
        () => ({ orgUnits, rootIds, reportMissingOrgUnit }),
        [orgUnits, rootIds, reportMissingOrgUnit]
    )
    return (
        <ProgramOrgUnitsContext.Provider value={value}>
            {children}
        </ProgramOrgUnitsContext.Provider>
    )
}

/** `undefined` outside a provider, so callers can fall back to default widgets. */
export function useProgramOrgUnitsContext() {
    return useContext(ProgramOrgUnitsContext)
}

/** Returns a guard that flags a missing org unit on the context bar; true when one is set. */
export function useOrgUnitGuard(orgUnitId: string) {
    const context = useProgramOrgUnitsContext()
    const report = context?.reportMissingOrgUnit
    return useCallback(() => {
        if (orgUnitId) {
            return true
        }
        report?.()
        return false
    }, [orgUnitId, report])
}
