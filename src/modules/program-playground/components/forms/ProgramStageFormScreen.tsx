import i18n from '@dhis2/d2-i18n'
import { selectProgramStage } from '@nnkogift/dhis2-form-utils-metadata'
import {
    ProgramEventForm,
    type ProgramEventFormProps,
} from './ProgramEventForm'

type ProgramStageFormScreenProps = Omit<
    ProgramEventFormProps,
    'stageMetadata' | 'programStageId'
> & {
    programStageId?: string
}

export function ProgramStageFormScreen({
    program,
    programStageId,
    orgUnitId,
    occurredAt,
    enrollment,
    events,
    supplementaryData,
    optionGroups,
    onValuesChange,
}: ProgramStageFormScreenProps) {
    const stageMetadata = programStageId
        ? selectProgramStage(program, programStageId)
        : undefined

    if (!programStageId || !stageMetadata) {
        return (
            <div className="p-4 text-dhis2-grey-700">
                {i18n.t('This program stage does not have a form to render.')}
            </div>
        )
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
            <ProgramEventForm
                program={program}
                stageMetadata={stageMetadata}
                programStageId={programStageId}
                orgUnitId={orgUnitId}
                occurredAt={occurredAt}
                enrollment={enrollment}
                events={events}
                supplementaryData={supplementaryData}
                optionGroups={optionGroups}
                onValuesChange={onValuesChange}
            />
        </div>
    )
}
