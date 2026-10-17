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
    type RuleEventInput,
    type RuleSupplementaryDataInput,
} from '@nnkogift/dhis2-form-utils-rules'
import React, { useMemo } from 'react'
import { CompletionBanner } from './CompletionBanner'
import {
    useCompletionMessageCollector,
    useCompletionPass,
} from '@/modules/program-playground/hooks/useCompletionPass'
import { LazyRulesPanel } from '@/modules/program-playground/components/rules/LazyRulesPanel'
import { usePublishFormValues } from '@/modules/program-playground/hooks/usePublishFormValues'
import { currentReport } from '@/modules/program-playground/hooks/useServerVerification'
import { useFormServerCheck } from '@/modules/program-playground/hooks/useFormServerCheck'
import {
    buildEventPayload,
    eventFormValuesSchema,
    type EventFormValues,
    type EventStatus,
    withSystemFieldValues,
} from '@/modules/program-playground/utils/trackerPayloads'
import { useOrgUnitGuard } from '@/modules/program-playground/components/orgUnit/ProgramOrgUnitsContext'
import { EventFormFields } from './EventFormFields'
import { buildActionTypesByRule } from '@/modules/program-playground/utils/buildActionTypesByRule'
import { listMandatoryFieldIds } from '@/modules/program-playground/utils/listMandatoryFieldIds'
import { omitUndefined } from '@/modules/program-playground/utils/omitUndefined'
import { useEventReviewFlow } from '@/modules/program-playground/hooks/useEventReviewFlow'
import { useSyncFormValue } from '@/modules/program-playground/hooks/useSyncFormValue'
import { validateForm } from '@/modules/program-playground/utils/validateForm'
import { ProgramFormActions } from './ProgramFormActions'
import { RuleFormBody } from './RuleFormBody'
import { parseFormValues } from '@/modules/program-playground/utils/parseFormValues'
import { SaveReviewDialog } from './SaveReviewDialog'

const EVENT_FORM_SYSTEM_KEYS = ['orgUnit', 'occurredAt'] as const

export type ProgramEventFormProps = {
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
    const ensureOrgUnit = useOrgUnitGuard(orgUnitId)
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

    const actionTypesByRule = useMemo(
        () => buildActionTypesByRule(program.programRules),
        [program.programRules]
    )
    const mandatoryFieldIds = useMemo(
        () => listMandatoryFieldIds(stageMetadata),
        [stageMetadata]
    )
    const completion = useCompletionPass({
        form,
        formStore,
        collector: completionCollector,
        mandatoryFieldIds,
        resolveFieldName: labelLookup.resolveFieldName,
    })

    useSyncFormValue(form, 'orgUnit', orgUnitId)
    useSyncFormValue(form, 'occurredAt', occurredAt)

    const {
        review,
        verifyStatus,
        openReview,
        handleCancelReview,
        handleComplete,
        handleSave,
    } = useEventReviewFlow({
        completion,
        ensureOrgUnit,
        getValues: form.getValues,
        enrollment,
    })

    // The dry run posts exactly what a save would.
    const buildEventSubmission = (
        status: EventStatus,
        resolvedValues: EventFormValues
    ) => {
        const values = withSystemFieldValues(
            omitUndefined(resolvedValues),
            form.getValues(),
            EVENT_FORM_SYSTEM_KEYS
        )
        const parsedValues = parseFormValues(eventFormValuesSchema, values, {
            formStore,
            ensureOrgUnit,
        })
        const payload = buildEventPayload({
            values: parsedValues,
            programId: program.id,
            programStageId,
            status,
        })
        return { values, payload }
    }

    // Verify dry-runs whichever status the summary was last opened for, so
    // on-complete rules are checked once the user has gone down that path.
    const serverCheck = useFormServerCheck({
        form,
        status: verifyStatus,
        actionTypesByRule,
        buildPayload: () =>
            buildEventSubmission(verifyStatus, form.getValues()).payload,
    })

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
                        <RuleFormBody
                            rulesMetadata={rulesMetadata}
                            labelLookup={labelLookup}
                            fields={
                                <EventFormFields metadata={stageMetadata} />
                            }
                        >
                            {completion.phase === 'review' ? (
                                <CompletionBanner
                                    issues={completion.issues}
                                    isSubmitting={form.formState.isSubmitting}
                                    onBackToEditing={completion.cancel}
                                    onCompleteAnyway={() => {
                                        openReview('COMPLETED')
                                    }}
                                />
                            ) : null}
                            <ProgramFormActions
                                completionPhase={completion.phase}
                                onValidate={() => {
                                    ensureOrgUnit()
                                    return validateForm(form)
                                }}
                                resolveFieldLabel={labelLookup.resolveFieldName}
                                serverCheck={{
                                    state: serverCheck.state,
                                    unplaced: serverCheck.unplaced,
                                    onVerify: () => {
                                        void serverCheck.verify()
                                    },
                                }}
                                onSave={handleSave}
                                onComplete={() => {
                                    void handleComplete()
                                }}
                            />
                        </RuleFormBody>
                    </form>
                    <LazyRulesPanel metadata={rulesMetadata} />
                    {review ? (
                        <SaveReviewDialog
                            formStore={formStore}
                            programId={program.id}
                            values={review.values}
                            labelLookup={labelLookup}
                            serverReport={
                                currentReport(serverCheck.state)?.verification
                            }
                            onClose={handleCancelReview}
                        />
                    ) : null}
                </div>
            </RuleDevtoolsScope>
        </FormStateProvider>
    )
}
