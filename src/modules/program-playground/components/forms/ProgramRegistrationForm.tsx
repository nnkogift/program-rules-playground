import { useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    createLabelLookup,
    type ProgramStageRef,
} from '@nnkogift/dhis2-form-utils-devtools'
import { RuleDevtoolsScope } from '@nnkogift/dhis2-form-utils-devtools/scope'
import {
    FormStateProvider,
    type TrackerProgramMetadata,
    useTrackerForm,
} from '@nnkogift/dhis2-form-utils-hooks'
import type { OptionGroupCodeMap } from '@nnkogift/dhis2-form-utils-metadata'
import {
    filterPayload,
    type RuleEventInput,
    type RuleSupplementaryDataInput,
} from '@nnkogift/dhis2-form-utils-rules'
import React, { useEffect, useMemo, useState } from 'react'
import { FormProvider } from 'react-hook-form'
import { GhostToggleButton } from '@/modules/program-playground/components/rules/GhostToggleButton'
import { LazyRulesPanel } from '@/modules/program-playground/components/rules/LazyRulesPanel'
import { RuleDisplayProvider } from '@/modules/program-playground/components/rules/RuleDisplayContext'
import { RuleOutputColumn } from '@/modules/program-playground/components/rules/RuleOutputColumn'
import { usePublishFormValues } from '@/modules/program-playground/hooks/usePublishFormValues'
import { createTodayValue } from '@/modules/program-playground/utils/date.utils'
import { formatDhis2Error } from '@/modules/program-playground/utils/formatDhis2Error'
import {
    buildTrackerRegistrationPayload,
    trackerRegistrationValuesSchema,
    type TrackerRegistrationValues,
    withSystemFieldValues,
} from '@/modules/program-playground/utils/trackerPayloads'
import { FormDateField } from './FormDateField'
import { SaveReviewDialog } from './SaveReviewDialog'
import { validateForm } from '@/modules/program-playground/utils/validateForm'
import { ProgramFormActions } from './ProgramFormActions'
import { RegistrationFormFields } from './RegistrationFormFields'

const REGISTRATION_FORM_SYSTEM_KEYS = [
    'orgUnit',
    'enrolledAt',
    'occurredAt',
] as const

type ProgramRegistrationFormProps = {
    programId: string
    metadata: TrackerProgramMetadata
    programStages: ProgramStageRef[]
    orgUnitId: string
    enrolledAt: string
    events?: RuleEventInput[]
    supplementaryData?: RuleSupplementaryDataInput
    optionGroups?: OptionGroupCodeMap
    onValuesChange?: (values: Record<string, unknown>) => void
}

export function ProgramRegistrationForm({
    programId,
    metadata,
    programStages,
    orgUnitId,
    enrolledAt,
    events,
    supplementaryData,
    optionGroups,
    onValuesChange,
}: ProgramRegistrationFormProps) {
    const dataEngine = useDataEngine()
    const defaultValues = useMemo(
        () => ({
            orgUnit: orgUnitId,
            enrolledAt,
            ...(metadata.displayIncidentDate
                ? { occurredAt: createTodayValue() }
                : {}),
        }),
        // intentionally computed once, at mount, as RHF's initial snapshot only —
        // live updates flow through the setValue effects below, not through this memo
        []
    )
    const { form, formStore } = useTrackerForm<TrackerRegistrationValues>({
        options: {
            programId,
            metadata,
            events,
            supplementaryData,
            optionGroups,
        },
        formOptions: {
            mode: 'onBlur',
            defaultValues,
        },
    })
    usePublishFormValues(form, onValuesChange)
    const [successMessage, setSuccessMessage] = useState<string>()
    const [ghostsEnabled, setGhostsEnabled] = useState(true)
    const [review, setReview] = useState<{ values: Record<string, unknown> }>()
    const rulesMetadata = useMemo(
        () => ({ formKind: 'tracker' as const, metadata, programStages }),
        [metadata, programStages]
    )
    const labelLookup = useMemo(
        () => createLabelLookup(rulesMetadata),
        [rulesMetadata]
    )

    const actionTypesByRule = useMemo(() => {
        const byRule = new Map<string, string[]>()
        for (const rule of metadata.programRules) {
            if (rule.id) {
                byRule.set(
                    rule.id,
                    rule.programRuleActions.map(
                        (action) => action.programRuleActionType
                    )
                )
            }
        }
        return byRule
    }, [metadata.programRules])

    useEffect(() => {
        form.setValue('orgUnit', orgUnitId, { shouldValidate: false })
    }, [form, orgUnitId])

    useEffect(() => {
        form.setValue('enrolledAt', enrolledAt, { shouldValidate: false })
    }, [form, enrolledAt])

    // Shared by Confirm and Verify so the dry run posts exactly what Confirm does.
    const buildRegistrationSubmission = (
        resolvedValues: TrackerRegistrationValues
    ) => {
        const definedValues = Object.fromEntries(
            Object.entries(resolvedValues).filter(
                ([, value]) => value !== undefined
            )
        ) as TrackerRegistrationValues
        const values = withSystemFieldValues(
            definedValues,
            form.getValues(),
            REGISTRATION_FORM_SYSTEM_KEYS
        )
        const parsedValues = trackerRegistrationValuesSchema.safeParse(
            filterPayload(
                values,
                formStore.fieldStore.getSnapshot(),
                formStore.optionGroups
            )
        )
        if (!parsedValues.success) {
            throw new Error(
                i18n.t('The form values could not be validated before saving')
            )
        }
        const payload = buildTrackerRegistrationPayload({
            values: parsedValues.data,
            metadata,
            programId,
        })
        return { values, payload }
    }

    const submit = form.handleSubmit(async (resolvedValues) => {
        form.clearErrors('root')
        setSuccessMessage(undefined)

        try {
            const { values, payload } =
                buildRegistrationSubmission(resolvedValues)

            await dataEngine.mutate({
                resource: 'tracker',
                type: 'create',
                data: payload,
            })

            form.reset(values)
            setSuccessMessage(i18n.t('Server rules ran on the registration'))
        } catch (error) {
            form.setError('root', {
                message: formatDhis2Error(error),
            })
        }
    })

    // The importer runs server-side rule actions on registration too, so the
    // submit is reviewed before anything is posted.
    const handleReview = () => {
        setReview({ values: form.getValues() })
    }

    const handleConfirmReview = () => {
        setReview(undefined)
        void submit()
    }

    return (
        <FormStateProvider<TrackerRegistrationValues>
            formStore={formStore}
            form={form}
        >
            <RuleDevtoolsScope formStore={formStore}>
                <div className="flex h-full w-full flex-1 min-h-0">
                    <FormProvider {...form}>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault()
                                handleReview()
                            }}
                            className="flex min-w-0 flex-1 flex-col overflow-auto pt-4 px-7 pb-7"
                        >
                            {metadata.displayIncidentDate ? (
                                <FormDateField
                                    name="occurredAt"
                                    label={
                                        metadata.displayIncidentDateLabel ??
                                        i18n.t('Incident date')
                                    }
                                    disabled={form.formState.isSubmitting}
                                />
                            ) : null}
                            <GhostToggleButton
                                enabled={ghostsEnabled}
                                onToggle={() => {
                                    setGhostsEnabled((current) => !current)
                                }}
                            />
                            <div className="flex flex-1 flex-row-reverse items-start gap-5 pt-4">
                                <div className="sticky top-0 shrink-0">
                                    <RuleOutputColumn
                                        metadata={rulesMetadata}
                                    />
                                </div>
                                <div className="flex min-w-[520px] flex-1 flex-col gap-dp16">
                                    <RuleDisplayProvider
                                        ghostsEnabled={ghostsEnabled}
                                        labelLookup={labelLookup}
                                    >
                                        <RegistrationFormFields
                                            metadata={metadata}
                                        />
                                    </RuleDisplayProvider>
                                    <ProgramFormActions
                                        onValidate={() => validateForm(form)}
                                        resolveFieldLabel={
                                            labelLookup.resolveFieldName
                                        }
                                        submitLabel={i18n.t(
                                            'Trigger server rules'
                                        )}
                                        errorTitle={i18n.t(
                                            'Could not trigger server rules'
                                        )}
                                        successMessage={successMessage}
                                        successTitle={i18n.t(
                                            'Server rules triggered'
                                        )}
                                    />
                                </div>
                            </div>
                        </form>
                    </FormProvider>
                    <LazyRulesPanel metadata={rulesMetadata} />
                    {review ? (
                        <SaveReviewDialog
                            formStore={formStore}
                            status="ACTIVE"
                            confirmLabel={i18n.t('Trigger server rules')}
                            programId={programId}
                            values={review.values}
                            labelLookup={labelLookup}
                            buildPayload={() =>
                                buildRegistrationSubmission(form.getValues())
                                    .payload
                            }
                            actionTypesByRule={actionTypesByRule}
                            onCancel={() => {
                                setReview(undefined)
                            }}
                            onConfirm={handleConfirmReview}
                        />
                    ) : null}
                </div>
            </RuleDevtoolsScope>
        </FormStateProvider>
    )
}
