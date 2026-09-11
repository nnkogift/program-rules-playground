import { z } from 'zod'

const orgUnitSchema = z.object({
    id: z.string(),
    displayName: z.string(),
})

export const accessibleOrgUnitsResponseSchema = z.object({
    me: z.object({
        organisationUnits: z.array(orgUnitSchema).optional(),
        dataViewOrganisationUnits: z.array(orgUnitSchema).optional(),
        teiSearchOrganisationUnits: z.array(orgUnitSchema).optional(),
    }),
})

export type AccessibleOrgUnitsResponse = z.infer<
    typeof accessibleOrgUnitsResponseSchema
>
