import { z } from 'zod'

const programOrgUnitSchema = z.object({
    id: z.string(),
    displayName: z.string(),
    path: z.string(),
})

export const programOrgUnitsResponseSchema = z.object({
    program: z.object({
        organisationUnits: z.array(programOrgUnitSchema).optional(),
    }),
})

export type ProgramOrgUnit = z.infer<typeof programOrgUnitSchema>
