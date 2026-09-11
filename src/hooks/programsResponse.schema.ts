import { z } from 'zod'
import { PROGRAM_TYPE } from '@/types/program'

export const rawProgramListItemSchema = z.object({
    id: z.string(),
    displayName: z.string(),
    code: z.string(),
    shortName: z.string(),
    programType: z.enum([
        PROGRAM_TYPE.WITH_REGISTRATION,
        PROGRAM_TYPE.WITHOUT_REGISTRATION,
    ]),
    lastUpdated: z.string().optional(),
    programStages: z.array(z.object({ id: z.string() })).optional(),
    programRules: z.array(z.object({ id: z.string() })).optional(),
})

export const pagerSchema = z.object({
    page: z.number(),
    pageCount: z.number(),
    total: z.number(),
    pageSize: z.number(),
})

export const programsResponseSchema = z.object({
    programs: z.array(rawProgramListItemSchema),
    pager: pagerSchema,
})

export type RawProgramListItem = z.infer<typeof rawProgramListItemSchema>
export type ProgramsResponse = z.infer<typeof programsResponseSchema>
