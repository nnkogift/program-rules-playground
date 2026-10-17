import { useMemo } from 'react'
import { useEventProgramMetadataQuery } from '@nnkogift/dhis2-form-utils-hooks'
import { useAccessibleOrgUnits } from '@/modules/program-playground/hooks/useAccessibleOrgUnits'
import { useCurrentUserSupplementaryData } from '@/modules/program-playground/hooks/useCurrentUserSupplementaryData'
import { useOptionGroupsSupplementaryData } from '@/modules/program-playground/hooks/useOptionGroupsSupplementaryData'
import { useProgramOrgUnits } from '@/modules/program-playground/hooks/useProgramOrgUnits'
import { getTreeRoots } from '@/modules/program-playground/utils/orgUnitTree'

/** Everything the program page needs from the server, in one place. */
export function useProgramPageData(programId: string) {
    const {
        metadata: program,
        error,
        loading,
    } = useEventProgramMetadataQuery(programId)
    const {
        orgUnits: accessibleOrgUnits,
        loading: orgUnitsLoading,
        error: orgUnitsError,
    } = useAccessibleOrgUnits()
    const {
        orgUnits: programOrgUnits,
        loading: programOrgUnitsLoading,
        error: programOrgUnitsError,
    } = useProgramOrgUnits(programId)
    const orgUnitRootIds = useMemo(
        () =>
            getTreeRoots(
                programOrgUnits,
                accessibleOrgUnits.map((orgUnit) => orgUnit.id)
            ),
        [programOrgUnits, accessibleOrgUnits]
    )
    const supplementaryData = useCurrentUserSupplementaryData()
    const optionGroups = useOptionGroupsSupplementaryData(
        program?.programRules ?? []
    )

    return {
        program,
        error,
        isLoading: loading || orgUnitsLoading || programOrgUnitsLoading,
        programOrgUnits,
        orgUnitRootIds,
        hasOrgUnitsError: Boolean(orgUnitsError || programOrgUnitsError),
        supplementaryData,
        optionGroups,
    }
}
