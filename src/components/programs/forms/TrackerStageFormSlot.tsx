import { memo, useCallback, useMemo } from 'react'
import type {
    EventProgramMetadata,
    OptionGroupCodeMap,
    TrackerProgramMetadata,
} from '@nnkogift/dhis2-form-utils-metadata'
import type { RuleSupplementaryDataInput } from '@nnkogift/dhis2-form-utils-rules'
import { useShallow } from 'zustand/react/shallow'
import { selectEventsExcludingSlot } from '../trackerFormsStore'
import { useTrackerFormsStore } from '../trackerFormsStoreContext'
import { ProgramStageFormScreen } from './ProgramStageFormScreen'

function createTodayValue() {
    return new Date().toISOString().slice(0, 10)
}

type TrackerStageFormSlotProps = {
    slotId: string
    program: EventProgramMetadata
    programStageId: string
    orgUnitId: string
    enrollment?: {
        metadata: TrackerProgramMetadata
        values: Record<string, unknown>
    }
    supplementaryData?: RuleSupplementaryDataInput
    optionGroups?: OptionGroupCodeMap
    isSelected: boolean
}

export const TrackerStageFormSlot = memo(function TrackerStageFormSlot({
    slotId,
    program,
    programStageId,
    orgUnitId,
    enrollment,
    supplementaryData,
    optionGroups,
    isSelected,
}: TrackerStageFormSlotProps) {
    // Fixed at first render and kept stable for the slot's lifetime — this
    // component stays mounted (visibility toggled via CSS) so switching
    // between events must not reset an already-open event's date field.
    const occurredAt = useMemo(() => createTodayValue(), [slotId])
    const setEventValues = useTrackerFormsStore((state) => state.setEventValues)
    const handleValuesChange = useCallback(
        (values: Record<string, unknown>) => setEventValues(slotId, values),
        [setEventValues, slotId]
    )
    // Own selector (rather than a prop from TrackerProgramShell) so this slot only
    // re-renders when the sibling events it actually receives change — not on every
    // keystroke in every other mounted form.
    const events = useTrackerFormsStore(
        useShallow(selectEventsExcludingSlot(slotId))
    )

    return (
        <div className={isSelected ? 'flex min-h-0 min-w-0 flex-1' : 'hidden'}>
            <ProgramStageFormScreen
                program={program}
                programStageId={programStageId}
                orgUnitId={orgUnitId}
                occurredAt={occurredAt}
                enrollment={enrollment}
                events={events}
                supplementaryData={supplementaryData}
                optionGroups={optionGroups}
                onValuesChange={handleValuesChange}
            />
        </div>
    )
})
