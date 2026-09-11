export const PROGRAM_TYPE = {
    WITH_REGISTRATION: 'WITH_REGISTRATION',
    WITHOUT_REGISTRATION: 'WITHOUT_REGISTRATION',
} as const

export type ProgramType = (typeof PROGRAM_TYPE)[keyof typeof PROGRAM_TYPE]

export type Program = {
    id: string
    displayName: string
    code: string
    shortName: string
    programType: ProgramType
    lastUpdated: string
    stageCount: number
    ruleCount: number
}

export type Pager = {
    page: number
    pageCount: number
    total: number
    pageSize: number
}

export const PROGRAM_TYPE_FILTER = {
    ALL: 'all',
    REGISTRATION: 'registration',
    EVENT: 'event',
} as const

export type ProgramTypeFilter =
    (typeof PROGRAM_TYPE_FILTER)[keyof typeof PROGRAM_TYPE_FILTER]

export type ProgramListParams = {
    search: string
    type: ProgramTypeFilter
    page: number
    pageSize: number
}

export type OrgUnit = {
    id: string
    displayName: string
}
