import { useMemo } from 'react'
import { useTrackerMetadataQuery } from '@nnkogift/dhis2-form-utils-hooks'
import type {
    EventProgramMetadata,
    OptionGroupCodeMap,
} from '@nnkogift/dhis2-form-utils-metadata'
import type { RuleSupplementaryDataInput } from '@nnkogift/dhis2-form-utils-rules'
import { EnrollmentRail } from '../EnrollmentRail'
import { slotKey } from '../trackerSlot'
import {
    TrackerFormsStoreProvider,
    useTrackerFormsStore,
} from '../trackerFormsStoreContext'
import { ProgramRegistrationFormScreen } from './ProgramRegistrationFormScreen'
import { TrackerStageFormSlot } from './TrackerStageFormSlot'

type TrackerProgramShellProps = {
    program: EventProgramMetadata
    programId: string
    orgUnitId: string
    enrolledAt: string
    supplementaryData?: RuleSupplementaryDataInput
    optionGroups?: OptionGroupCodeMap
}

type RenderableStageSlot = { stageId: string; eventLocalId: string }

export function TrackerProgramShell(props: TrackerProgramShellProps) {
    return (
        <TrackerFormsStoreProvider>
            <TrackerProgramShellContent {...props} />
        </TrackerFormsStoreProvider>
    )
}

function TrackerProgramShellContent({
    program,
    programId,
    orgUnitId,
    enrolledAt,
    supplementaryData,
    optionGroups,
}: TrackerProgramShellProps) {
    const {
        metadata: trackerMetadata,
        loading: trackerLoading,
        error: trackerError,
    } = useTrackerMetadataQuery(programId)

    const selectedSlot = useTrackerFormsStore((state) => state.selectedSlot)
    const eventDraftsByStage = useTrackerFormsStore(
        (state) => state.eventDraftsByStage
    )
    const registrationValues = useTrackerFormsStore(
        (state) => state.registrationValues
    )
    const setRegistrationValues = useTrackerFormsStore(
        (state) => state.setRegistrationValues
    )

    // Every stage/event combination renders as soon as it exists and stays mounted
    // (visibility toggled via CSS) rather than being destroyed on navigation — otherwise
    // switching rail rows would discard whatever the user had already typed into an event.
    const renderableStageSlots = useMemo<RenderableStageSlot[]>(() => {
        const slots: RenderableStageSlot[] = []
        for (const stage of program.programStages ?? []) {
            if (stage.repeatable) {
                for (const eventLocalId of eventDraftsByStage[stage.id] ?? []) {
                    slots.push({ stageId: stage.id, eventLocalId })
                }
            } else {
                slots.push({ stageId: stage.id, eventLocalId: 'primary' })
            }
        }
        return slots
    }, [program.programStages, eventDraftsByStage])

    const enrollment = useMemo(
        () =>
            trackerMetadata
                ? {
                      metadata: trackerMetadata,
                      values: registrationValues ?? {},
                  }
                : undefined,
        [trackerMetadata, registrationValues]
    )

    return (
        <div className="flex min-h-0 flex-1 overflow-x-auto">
            <EnrollmentRail
                program={program}
                trackerMetadata={trackerMetadata}
            />
            <div
                className={
                    selectedSlot.kind === 'registration'
                        ? 'flex min-h-0 min-w-0 flex-1'
                        : 'hidden'
                }
            >
                <ProgramRegistrationFormScreen
                    programId={programId}
                    orgUnitId={orgUnitId}
                    enrolledAt={enrolledAt}
                    metadata={trackerMetadata}
                    programStages={program.programStages}
                    loading={trackerLoading}
                    error={trackerError}
                    supplementaryData={supplementaryData}
                    optionGroups={optionGroups}
                    onValuesChange={setRegistrationValues}
                />
            </div>
            {renderableStageSlots.map((slot) => {
                const key = slotKey({ kind: 'stage', ...slot })
                const isSelected = slotKey(selectedSlot) === key

                return (
                    <TrackerStageFormSlot
                        key={key}
                        slotId={key}
                        program={program}
                        programStageId={slot.stageId}
                        orgUnitId={orgUnitId}
                        enrollment={enrollment}
                        supplementaryData={supplementaryData}
                        optionGroups={optionGroups}
                        isSelected={isSelected}
                    />
                )
            })}
        </div>
    )
}
