import { createStore } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { RuleEventInput } from '@nnkogift/dhis2-form-utils-rules'
import { EVENT_SYSTEM_FIELD_KEYS } from '@/utils/trackerPayloads'
import type { TrackerSlot } from './trackerSlot'

type TrackerFormsState = {
    selectedSlot: TrackerSlot
    eventDraftsByStage: Record<string, string[]>
    draftCounters: Record<string, number>
    registrationValues: Record<string, unknown> | undefined
    eventValuesBySlot: Record<string, Record<string, unknown>>
}

type TrackerFormsActions = {
    selectSlot: (slot: TrackerSlot) => void
    addEvent: (stageId: string) => void
    setRegistrationValues: (values: Record<string, unknown>) => void
    setEventValues: (key: string, values: Record<string, unknown>) => void
}

export type TrackerFormsStore = TrackerFormsState & TrackerFormsActions

export function createTrackerFormsStore() {
    return createStore<TrackerFormsStore>()(
        immer((set) => ({
            selectedSlot: { kind: 'registration' },
            eventDraftsByStage: {},
            draftCounters: {},
            registrationValues: undefined,
            eventValuesBySlot: {},
            selectSlot: (slot) =>
                set((state) => {
                    state.selectedSlot = slot
                }),
            addEvent: (stageId) =>
                set((state) => {
                    const nextCount = (state.draftCounters[stageId] ?? 0) + 1
                    state.draftCounters[stageId] = nextCount
                    const eventLocalId = `${stageId}-${nextCount}`
                    const drafts = state.eventDraftsByStage[stageId] ?? []
                    state.eventDraftsByStage[stageId] = [
                        ...drafts,
                        eventLocalId,
                    ]
                    state.selectedSlot = {
                        kind: 'stage',
                        stageId,
                        eventLocalId,
                    }
                }),
            setRegistrationValues: (values) =>
                set((state) => {
                    state.registrationValues = values
                }),
            setEventValues: (key, values) =>
                set((state) => {
                    state.eventValuesBySlot[key] = values
                }),
        }))
    )
}

function toRuleEventInput(
    key: string,
    stageId: string,
    values: Record<string, unknown>
): RuleEventInput {
    const dataValues = Object.fromEntries(
        Object.entries(values).filter(
            ([field]) => !EVENT_SYSTEM_FIELD_KEYS.has(field)
        )
    )

    return {
        event: key,
        programStage: stageId,
        orgUnit:
            typeof values.orgUnit === 'string' ? values.orgUnit : undefined,
        eventDate:
            typeof values.occurredAt === 'string' ? values.occurredAt : null,
        dataValues,
    }
}

// Keyed by the slot's `values` object reference (which only changes when that
// slot's own `setEventValues` runs) so untouched slots keep returning the exact
// same `RuleEventInput` object across selector calls — required for `useShallow`
// to actually skip re-renders instead of seeing a "new" array every time.
const ruleEventCache = new WeakMap<Record<string, unknown>, RuleEventInput>()

function getCachedRuleEventInput(
    key: string,
    stageId: string,
    values: Record<string, unknown>
): RuleEventInput {
    const cached = ruleEventCache.get(values)
    if (cached && cached.event === key) {
        return cached
    }
    const event = toRuleEventInput(key, stageId, values)
    ruleEventCache.set(values, event)
    return event
}

/**
 * Selects the `RuleEventInput[]` for every stage slot other than `excludeKey`, so a
 * form never sees its own in-progress event echoed back as a sibling. Pair with
 * zustand's `useShallow` so a keystroke in one slot doesn't re-render forms whose
 * derived array is referentially unchanged.
 */
export function selectEventsExcludingSlot(excludeKey?: string) {
    return (state: TrackerFormsStore): RuleEventInput[] => {
        const entries: RuleEventInput[] = []
        for (const [key, values] of Object.entries(state.eventValuesBySlot)) {
            if (key === excludeKey) {
                continue
            }
            const stageId = key.split(':')[0]
            entries.push(getCachedRuleEventInput(key, stageId, values))
        }
        return entries
    }
}
