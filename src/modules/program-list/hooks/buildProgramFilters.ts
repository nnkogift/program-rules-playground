import {
    PROGRAM_TYPE,
    PROGRAM_TYPE_FILTER,
    type ProgramTypeFilter,
} from '@/shared/types/program'

export function programTypeFilterToApi(
    type: ProgramTypeFilter
): string | undefined {
    if (type === PROGRAM_TYPE_FILTER.REGISTRATION) {
        return PROGRAM_TYPE.WITH_REGISTRATION
    }
    if (type === PROGRAM_TYPE_FILTER.EVENT) {
        return PROGRAM_TYPE.WITHOUT_REGISTRATION
    }
    return undefined
}

export function buildProgramFilters(
    search: string,
    type: ProgramTypeFilter
): string[] {
    const filters: string[] = []
    const trimmedSearch = search.trim()

    if (trimmedSearch) {
        filters.push(`identifiable:token:${trimmedSearch}`)
    }

    const programType = programTypeFilterToApi(type)
    if (programType) {
        filters.push(`programType:eq:${programType}`)
    }

    return filters
}
