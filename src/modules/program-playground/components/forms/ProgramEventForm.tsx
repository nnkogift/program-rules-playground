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
import { CompletionBanner } from './CompletionBanner'
import {
    useCompletionMessageCollector,
    useCompletionPass,
} from '@/modules/program-playground/hooks/useCompletionPass'
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
import { SaveReviewDialog } from './SaveReviewDialog'

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

    const completionCollector = useCompletionMessageCollector()
    const { form, formStore } = useEventForm<EventFormValues>({
        options: {
            programStageId,
            metadata: program,
            enrollment,
            events,
            supplementaryData,
            optionGroups,
            effectHandlers: completionCollector.handlers,
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
    const [review, setReview] = useState<{
        status: EventStatus
        values: Record<string, unknown>
    }>()
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

    const mandatoryFieldIds = useMemo(
        () =>
            (stageMetadata.programStageDataElements ?? [])
                .filter((element) => element.compulsory)
                .map((element) => element.dataElement?.id)
                .filter((id): id is string => Boolean(id)),
        [stageMetadata]
    )
    const completion = useCompletionPass({
        form,
        formStore,
        collector: completionCollector,
        mandatoryFieldIds,
        resolveFieldName: labelLookup.resolveFieldName,
    })

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
                completion.finish()
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

    // The importer runs server-side rule actions for both statuses, so every
    // submit is reviewed before anything is posted.
    const openReview = (status: EventStatus) => {
        setReview({
            status,
            values: { ...enrollment?.values, ...form.getValues() },
        })
    }

    const handleCancelReview = () => {
        if (review?.status === 'COMPLETED') {
            completion.cancel()
        }
        setReview(undefined)
    }

    const handleConfirmReview = () => {
        if (!review) {
            return
        }
        setReview(undefined)
        void submit(review.status)()
    }

    const handleComplete = async () => {
        if ((await completion.start()) === 'proceed') {
            openReview('COMPLETED')
        }
    }

    const handleSave = () => {
        if (completion.phase !== 'idle') {
            completion.cancel()
        }
        openReview('ACTIVE')
    }

    return (
        <FormStateProvider<EventFormValues> formStore={formStore} form={form}>
            <RuleDevtoolsScope formStore={formStore}>
                <div className="flex h-full w-full flex-1 min-h-0">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault()
                            handleSave()
                        }}
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
                                {completion.phase === 'review' ? (
                                    <CompletionBanner
                                        issues={completion.issues}
                                        isSubmitting={
                                            form.formState.isSubmitting
                                        }
                                        onBackToEditing={completion.cancel}
                                        onCompleteAnyway={() => {
                                            openReview('COMPLETED')
                                        }}
                                    />
                                ) : null}
                                <ProgramFormActions
                                    completionPhase={completion.phase}
                                    onSave={handleSave}
                                    onComplete={() => {
                                        void handleComplete()
                                    }}
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
                    {review ? (
                        <SaveReviewDialog
                            formStore={formStore}
                            status={review.status}
                            programId={program.id}
                            values={review.values}
                            labelLookup={labelLookup}
                            onCancel={handleCancelReview}
                            onConfirm={handleConfirmReview}
                        />
                    ) : null}
                </div>
            </RuleDevtoolsScope>
        </FormStateProvider>
    )
}
