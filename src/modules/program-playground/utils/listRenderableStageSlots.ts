export type RenderableStageSlot = { stageId: string; eventLocalId: string }

type StageLike = { id?: string; repeatable?: boolean }

/**
 * Every stage/event combination that should be mounted: one `primary` slot per
 * non-repeatable stage, and one slot per draft event of a repeatable stage.
 */
export function listRenderableStageSlots(
    stages: readonly StageLike[] | undefined,
    eventDraftsByStage: Record<string, readonly string[] | undefined>
): RenderableStageSlot[] {
    const slots: RenderableStageSlot[] = []
    for (const stage of stages ?? []) {
        if (!stage.id) {
            continue
        }
        if (!stage.repeatable) {
            slots.push({ stageId: stage.id, eventLocalId: 'primary' })
            continue
        }
        for (const eventLocalId of eventDraftsByStage[stage.id] ?? []) {
            slots.push({ stageId: stage.id, eventLocalId })
        }
    }
    return slots
}
