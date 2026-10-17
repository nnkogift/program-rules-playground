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
import { validateForm } from '@/modules/program-playground/utils/validateForm'
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
    const [ghostsEnabled, setGhostsEnabled] = useState(true)
    const [verifyStatus, setVerifyStatus] = useState<EventStatus>('ACTIVE')
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

    const actionTypesByRule = useMemo(() => {
        const byRule = new Map<string, string[]>()
        for (const rule of program.programRules) {
            if (rule.id) {
                byRule.set(
                    rule.id,
                    (rule.programRuleActions ?? []).map(
                        (action) => action.programRuleActionType
                    )
                )
            }
        }
        return byRule
    }, [program.programRules])

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

    // The dry run posts exactly what a save would.
    const buildEventSubmission = (
        status: EventStatus,
        resolvedValues: EventFormValues
    ) => {
        // `getValues()` carries untouched fields as `undefined`, which the
        // schema rejects; the resolver output the save path gets omits them.
        const definedValues = Object.fromEntries(
            Object.entries(resolvedValues).filter(
                ([, value]) => value !== undefined
            )
        ) as EventFormValues
        const values = withSystemFieldValues(
            definedValues,
            form.getValues(),
            EVENT_FORM_SYSTEM_KEYS
        )
        const parsedValues = eventFormValuesSchema.safeParse(
            filterPayload(
                values,
                formStore.fieldStore.getSnapshot(),
                formStore.optionGroups
            )
        )
        if (!parsedValues.success) {
            if (!values.orgUnit) {
                ensureOrgUnit()
                throw new Error(
                    i18n.t(
                        'Select an organisation unit before saving or verifying'
                    )
                )
            }
            throw new Error(
                i18n.t('The form values could not be validated before saving')
            )
        }
        const payload = buildEventPayload({
            values: parsedValues.data,
            programId: program.id,
            programStageId,
            status,
        })
        return { values, payload }
    }

    // Opens the read-only summary of the server-side effects for this status.
    const openReview = (status: EventStatus) => {
        ensureOrgUnit()
        setVerifyStatus(status)
        setReview({
            status,
            values: { ...enrollment?.values, ...form.getValues() },
        })
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

    const handleCancelReview = () => {
        if (review?.status === 'COMPLETED') {
            completion.cancel()
        }
        setReview(undefined)
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
                                    onValidate={() => {
                                        ensureOrgUnit()
                                        return validateForm(form)
                                    }}
                                    resolveFieldLabel={
                                        labelLookup.resolveFieldName
                                    }
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
                            </div>
                        </div>
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
