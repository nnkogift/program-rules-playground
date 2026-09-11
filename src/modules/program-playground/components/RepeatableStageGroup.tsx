import i18n from '@dhis2/d2-i18n'
import { IconQueue16 } from '@dhis2/ui'
import { AddEventIconButton } from './AddEventIconButton'
import { RailRow } from './RailRow'
import type { TrackerSlot } from '../utils/trackerSlot'
import { slotKey } from '../utils/trackerSlot'

type RepeatableStageGroupProps = {
    stageId: string
    stageDisplayName: string
    drafts: string[]
    selectedKey: string
    onSelectSlot: (slot: TrackerSlot) => void
    onAddEvent: (stageId: string) => void
}

export function RepeatableStageGroup({
    stageId,
    stageDisplayName,
    drafts,
    selectedKey,
    onSelectSlot,
    onAddEvent,
}: RepeatableStageGroupProps) {
    return (
        <div className="flex flex-col">
            <RailRow
                icon={<IconQueue16 />}
                label={stageDisplayName}
                meta={
                    drafts.length === 0
                        ? i18n.t('No events yet')
                        : drafts.length === 1
                          ? i18n.t('1 event')
                          : i18n.t('{{count}} events', {
                                count: drafts.length,
                            })
                }
                selected={false}
                onClick={() => {
                    if (drafts.length === 0) {
                        return
                    }
                    onSelectSlot({
                        kind: 'stage',
                        stageId,
                        eventLocalId: drafts[0],
                    })
                }}
                action={
                    <AddEventIconButton onAdd={() => onAddEvent(stageId)} />
                }
            />
            {drafts.map((eventLocalId, index) => {
                const slot: TrackerSlot = {
                    kind: 'stage',
                    stageId,
                    eventLocalId,
                }
                return (
                    <RailRow
                        key={eventLocalId}
                        label={i18n.t('Event {{number}}', {
                            number: index + 1,
                        })}
                        meta=""
                        indent
                        selected={selectedKey === slotKey(slot)}
                        onClick={() => {
                            onSelectSlot(slot)
                        }}
                    />
                )
            })}
        </div>
    )
}
