import { useDataQuery } from '@dhis2/app-runtime'
import { useMemo } from 'react'
import {
    programOrgUnitsResponseSchema,
    type ProgramOrgUnit,
} from '@/modules/program-playground/schemas/programOrgUnits.schema'

type ProgramOrgUnitsQueryResult = {
    program: unknown
}

const PROGRAM_ORG_UNIT_FIELDS = 'organisationUnits[id,displayName,path]'

/** The org units a program is assigned to; only these are valid for its events and enrollments. */
export function useProgramOrgUnits(programId: string) {
    const query = useMemo(
        () => ({
            program: {
                resource: 'programs',
                id: programId,
                params: { fields: PROGRAM_ORG_UNIT_FIELDS },
            },
        }),
        [programId]
    )

    const queryResult = useDataQuery<ProgramOrgUnitsQueryResult>(query)
    const parsed = queryResult.data
        ? programOrgUnitsResponseSchema.safeParse(queryResult.data)
        : undefined
    const orgUnits = useMemo<ProgramOrgUnit[]>(
        () =>
            [
                ...(parsed?.success
                    ? (parsed.data.program.organisationUnits ?? [])
                    : []),
            ].sort((left, right) =>
                left.displayName.localeCompare(right.displayName)
            ),
        [parsed]
    )

    return {
        orgUnits,
        loading: queryResult.loading,
        error:
            queryResult.error ??
            (parsed?.success === false ? parsed.error : undefined),
    }
}
