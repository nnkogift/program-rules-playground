import { z } from 'zod'

export const currentUserSupplementaryDataResponseSchema = z.object({
    me: z.object({
        userGroups: z.array(z.object({ id: z.string() })).optional(),
        userRoles: z.array(z.object({ id: z.string() })).optional(),
    }),
})

export type CurrentUserSupplementaryDataResponse = z.infer<
    typeof currentUserSupplementaryDataResponseSchema
>
