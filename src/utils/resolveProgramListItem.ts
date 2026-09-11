import type { RawProgramListItem } from '@/hooks/programsResponse.schema'
import type { Program } from '@/types/program'

export function resolveProgramListItem(raw: RawProgramListItem): Program {
    return {
        id: raw.id,
        displayName: raw.displayName,
        code: raw.code,
        shortName: raw.shortName,
        programType: raw.programType,
        lastUpdated: raw.lastUpdated ?? '',
        stageCount: raw.programStages?.length ?? 0,
        ruleCount: raw.programRules?.length ?? 0,
    }
}
