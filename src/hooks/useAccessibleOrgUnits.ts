import { useDataQuery } from '@dhis2/app-runtime'
import { uniqBy } from 'lodash-es'
import { useMemo } from 'react'
import { accessibleOrgUnitsResponseSchema } from '@/hooks/accessibleOrgUnits.schema'
import type { OrgUnit } from '@/types/program'

type AccessibleOrgUnitsQueryResult = {
    me: unknown
}

const ME_ORG_UNIT_FIELDS = [
    'organisationUnits[id,displayName]',
    'dataViewOrganisationUnits[id,displayName]',
    'teiSearchOrganisationUnits[id,displayName]',
].join(',')

function dedupeOrgUnits(orgUnits: OrgUnit[]): OrgUnit[] {
    return uniqBy(
        orgUnits.filter((orgUnit) => orgUnit.id),
        'id'
    ).sort((left, right) => left.displayName.localeCompare(right.displayName))
}

export function useAccessibleOrgUnits() {
    const query = useMemo(
        () => ({
            me: {
                resource: 'me',
                params: {
                    fields: ME_ORG_UNIT_FIELDS,
                },
            },
        }),
        []
    )

    const queryResult = useDataQuery<AccessibleOrgUnitsQueryResult>(query)
    const parsed = queryResult.data
        ? accessibleOrgUnitsResponseSchema.safeParse(queryResult.data)
        : undefined
    const me = parsed?.success ? parsed.data.me : undefined
    const orgUnits = dedupeOrgUnits([
        ...(me?.teiSearchOrganisationUnits ?? []),
        ...(me?.dataViewOrganisationUnits ?? []),
        ...(me?.organisationUnits ?? []),
    ])

    return {
        ...queryResult,
        orgUnits,
    }
}
