import i18n from '@dhis2/d2-i18n'
import { IconFileDocument16, IconUser16 } from '@dhis2/ui'
import type { TrackerProgramMetadata } from '@nnkogift/dhis2-form-utils-hooks'
import type { EventProgramMetadata } from '@nnkogift/dhis2-form-utils-metadata'
import { RailRow } from './RailRow'
import { RepeatableStageGroup } from './RepeatableStageGroup'
import { useTrackerFormsStore } from './trackerFormsStoreContext'
import type { TrackerSlot } from '../utils/trackerSlot'
import { slotKey } from '../utils/trackerSlot'

type EnrollmentRailProps = {
    program: EventProgramMetadata
    trackerMetadata: TrackerProgramMetadata | undefined
}

export function EnrollmentRail({
    program,
    trackerMetadata,
}: EnrollmentRailProps) {
    const selectedSlot = useTrackerFormsStore((state) => state.selectedSlot)
    const eventDraftsByStage = useTrackerFormsStore(
        (state) => state.eventDraftsByStage
    )
    const selectSlot = useTrackerFormsStore((state) => state.selectSlot)
    const addEvent = useTrackerFormsStore((state) => state.addEvent)
    const stages = (program.programStages ?? [])
        .filter((stage): stage is typeof stage & { id: string } =>
            Boolean(stage.id)
        )
        .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    const selectedKey = slotKey(selectedSlot)

    return (
        <nav
            className="flex w-[268px] shrink-0 flex-col overflow-auto border-r border-dhis2-grey-300 bg-dhis2-grey-100"
            aria-label={i18n.t('Enrollment')}
        >
            <div className="px-4 pb-2 pt-3.5">
                <span className="text-[11px] font-bold uppercase tracking-[.09em] text-dhis2-grey-600">
                    {i18n.t('Enrollment')}
                </span>
            </div>
            <div className="flex flex-col">
                <RailRow
                    icon={<IconUser16 />}
                    label={i18n.t('Registration')}
                    meta={i18n.t('{{count}} attributes', {
                        count:
                            trackerMetadata?.programTrackedEntityAttributes
                                .length ?? 0,
                    })}
                    selected={selectedKey === slotKey({ kind: 'registration' })}
                    onClick={() => {
                        selectSlot({ kind: 'registration' })
                    }}
                />
                {stages.map((stage) => {
                    if (!stage.repeatable) {
                        const slot: TrackerSlot = {
                            kind: 'stage',
                            stageId: stage.id,
                            eventLocalId: 'primary',
                        }
                        return (
                            <RailRow
                                key={stage.id}
                                icon={<IconFileDocument16 />}
                                label={stage.displayName ?? ''}
                                meta={i18n.t('1 event')}
                                selected={selectedKey === slotKey(slot)}
                                onClick={() => {
                                    selectSlot(slot)
                                }}
                            />
                        )
                    }

                    return (
                        <RepeatableStageGroup
                            key={stage.id}
                            stageId={stage.id}
                            stageDisplayName={stage.displayName ?? ''}
                            drafts={eventDraftsByStage[stage.id] ?? []}
                            selectedKey={selectedKey}
                            onSelectSlot={selectSlot}
                            onAddEvent={addEvent}
                        />
                    )
                })}
            </div>
        </nav>
    )
}
