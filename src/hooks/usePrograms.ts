import { useDataQuery } from '@dhis2/app-runtime'
import { useEffect, useMemo } from 'react'
import { buildProgramFilters } from '@/hooks/buildProgramFilters'
import {
    type ProgramsResponse,
    programsResponseSchema,
} from '@/hooks/programsResponse.schema'
import type { ProgramTypeFilter } from '@/types/program'

type UseProgramsOptions = {
    page: number
    pageSize: number
    search: string
    type: ProgramTypeFilter
}

type ProgramsQueryResult = {
    programs: unknown
}

export function usePrograms({
    page,
    pageSize,
    search,
    type,
}: UseProgramsOptions) {
    // `params` closes over page/pageSize/search/type (rather than reading them from
    // the callback's own `variables` argument) so its parameter type doesn't have to
    // match useDataQuery's broad `QueryVariables` — the useMemo below already
    // recomputes this whenever those values change, and the effect re-triggers the
    // fetch with the same values via `refetch`.
    const query = useMemo(() => {
        return {
            programs: {
                resource: 'programs',
                params: () => {
                    const filters = buildProgramFilters(search, type)
                    return {
                        fields: 'id,displayName,code,shortName,programType,lastUpdated,programStages[id],programRules[id]',
                        order: 'displayName:asc',
                        page,
                        pageSize,
                        ...(filters.length > 0 ? { filter: filters } : {}),
                    }
                },
            },
        }
    }, [page, pageSize, search, type])

    const dataQuery = useDataQuery<ProgramsQueryResult>(query, {
        variables: {
            page,
            pageSize,
            search,
            type,
        },
        lazy: true,
    })

    useEffect(() => {
        dataQuery.refetch({
            page,
            pageSize,
            search,
            type,
        })
    }, [page, pageSize, search, type])

    const parsed = dataQuery.data
        ? programsResponseSchema.safeParse(dataQuery.data.programs)
        : undefined

    const data: { programs: ProgramsResponse } | undefined = parsed?.success
        ? { programs: parsed.data }
        : undefined

    return {
        ...dataQuery,
        data,
    }
}
