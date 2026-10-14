import { useDataEngine } from '@dhis2/app-runtime'
import { createLabelLookup } from '@nnkogift/dhis2-form-utils-devtools'
import { RuleDevtoolsScope } from '@nnkogift/dhis2-form-utils-devtools/scope'
import {
    FormStateProvider,
    useEventForm,
} from '@nnkogift/dhis2-form-utils-hooks'
import type {
    EventProgramMetadata,
    OptionGroupCodeMap,
    ProgramStageMetadata,
    TrackerProgramMetadata,
} from '@nnkogift/dhis2-form-utils-metadata'
import {
    filterPayload,
    type RuleEventInput,
    type RuleSupplementaryDataInput,
} from '@nnkogift/dhis2-form-utils-rules'
import i18n from '@dhis2/d2-i18n'
import React, { useEffect, useMemo, useState } from 'react'
import { GhostToggleButton } from '@/modules/program-playground/components/rules/GhostToggleButton'
import { LazyRulesPanel } from '@/modules/program-playground/components/rules/LazyRulesPanel'
import { RuleDisplayProvider } from '@/modules/program-playground/components/rules/RuleDisplayContext'
import { RuleOutputColumn } from '@/modules/program-playground/components/rules/RuleOutputColumn'
import { usePublishFormValues } from '@/modules/program-playground/hooks/usePublishFormValues'
import { formatDhis2Error } from '@/modules/program-playground/utils/formatDhis2Error'
import {
    buildEventPayload,
    eventFormValuesSchema,
    type EventFormValues,
    type EventStatus,
    withSystemFieldValues,
} from '@/modules/program-playground/utils/trackerPayloads'
import { EventFormFields } from './EventFormFields'
import { ProgramFormActions } from './ProgramFormActions'

const EVENT_FORM_SYSTEM_KEYS = ['orgUnit', 'occurredAt'] as const

type ProgramEventFormProps = {
    program: EventProgramMetadata
    stageMetadata: ProgramStageMetadata
    programStageId: string
    orgUnitId: string
    occurredAt: string
    enrollment?: {
        metadata: TrackerProgramMetadata
        values: Record<string, unknown>
    }
    events?: RuleEventInput[]
    supplementaryData?: RuleSupplementaryDataInput
    optionGroups?: OptionGroupCodeMap
    onValuesChange?: (values: Record<string, unknown>) => void
}

export function ProgramEventForm({
    program,
    stageMetadata,
    programStageId,
    orgUnitId,
    occurredAt,
    enrollment,
    events,
    supplementaryData,
    optionGroups,
    onValuesChange,
}: ProgramEventFormProps) {
    const dataEngine = useDataEngine()

    const { form, formStore } = useEventForm<EventFormValues>({
        options: {
            programStageId,
            metadata: program,
            enrollment,
            events,
            supplementaryData,
            optionGroups,
        },
        formOptions: {
            mode: 'onBlur',
            defaultValues: {
                orgUnit: orgUnitId,
                occurredAt,
            },
        },
    })
    usePublishFormValues(form, onValuesChange)
    const [success, setSuccess] = useState<{
        status: EventStatus
        message: string
    }>()
    const [ghostsEnabled, setGhostsEnabled] = useState(true)
    const rulesMetadata = useMemo(
        () => ({
            formKind: 'event' as const,
            metadata: program,
            programStageId,
        }),
        [program, programStageId]
    )
    const labelLookup = useMemo(
        () => createLabelLookup(rulesMetadata),
        [rulesMetadata]
    )

    useEffect(() => {
        form.setValue('orgUnit', orgUnitId, { shouldValidate: false })
    }, [form, orgUnitId])

    useEffect(() => {
        form.setValue('occurredAt', occurredAt, { shouldValidate: false })
    }, [form, occurredAt])

    const submit = (status: EventStatus) =>
        form.handleSubmit(async (resolvedValues) => {
            form.clearErrors('root')
            setSuccess(undefined)
            const values = withSystemFieldValues(
                resolvedValues,
                form.getValues(),
                EVENT_FORM_SYSTEM_KEYS
            )

            try {
                const parsedValues = eventFormValuesSchema.safeParse(
                    filterPayload(
                        values,
                        formStore.fieldStore.getSnapshot(),
                        formStore.optionGroups
                    )
                )
                if (!parsedValues.success) {
                    throw new Error(
                        i18n.t(
                            'The form values could not be validated before saving'
                        )
                    )
                }
                const filteredValues = parsedValues.data
                const payload = buildEventPayload({
                    values: filteredValues,
                    programId: program.id,
                    programStageId,
                    status,
                })

                await dataEngine.mutate({
                    resource: 'tracker',
                    type: 'create',
                    data: payload,
                })

                form.reset(values)
                setSuccess({
                    status,
                    message:
                        status === 'COMPLETED'
                            ? i18n.t('Event completed successfully')
                            : i18n.t('Event saved successfully'),
                })
            } catch (error) {
                form.setError('root', {
                    message: formatDhis2Error(error),
                })
            }
        })

    return (
        <FormStateProvider<EventFormValues> formStore={formStore} form={form}>
            <RuleDevtoolsScope formStore={formStore}>
                <div className="flex h-full w-full flex-1 min-h-0">
                    <form
                        onSubmit={submit('ACTIVE')}
                        className="flex min-w-0 flex-1 flex-col overflow-auto pt-4 px-7 pb-7"
                    >
                        <GhostToggleButton
                            enabled={ghostsEnabled}
                            onToggle={() => {
                                setGhostsEnabled((current) => !current)
                            }}
                        />
                        <div className="flex flex-1 flex-row-reverse items-start gap-5 pt-4">
                            <div className="sticky top-0 shrink-0">
                                <RuleOutputColumn metadata={rulesMetadata} />
                            </div>
                            <div className="flex min-w-[520px] flex-1 flex-col gap-dp16">
                                <RuleDisplayProvider
                                    ghostsEnabled={ghostsEnabled}
                                    labelLookup={labelLookup}
                                >
                                    <EventFormFields metadata={stageMetadata} />
                                </RuleDisplayProvider>
                                <ProgramFormActions
                                    onSave={submit('ACTIVE')}
                                    onComplete={submit('COMPLETED')}
                                    errorTitle={i18n.t('Could not save event')}
                                    successMessage={success?.message}
                                    successTitle={
                                        success?.status === 'COMPLETED'
                                            ? i18n.t('Event completed')
                                            : i18n.t('Event saved')
                                    }
                                />
                            </div>
                        </div>
                    </form>
                    <LazyRulesPanel metadata={rulesMetadata} />
                </div>
            </RuleDevtoolsScope>
        </FormStateProvider>
    )
}
