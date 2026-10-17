type StageLike = {
    programStageDataElements?: readonly {
        compulsory?: boolean
        dataElement?: { id?: string }
    }[]
}

/** Ids of the data elements a stage marks as compulsory. */
export function listMandatoryFieldIds(stage: StageLike): string[] {
    return (stage.programStageDataElements ?? [])
        .filter((element) => element.compulsory)
        .map((element) => element.dataElement?.id)
        .filter((id): id is string => Boolean(id))
}
