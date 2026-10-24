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
    type RuleEventInput,
    type RuleSupplementaryDataInput,
} from '@nnkogift/dhis2-form-utils-rules'
import React, { useMemo, useState } from 'react'

import { LazyRulesPanel } from '@/modules/program-playground/components/rules/LazyRulesPanel'
import { usePublishFormValues } from '@/modules/program-playground/hooks/usePublishFormValues'
import { createTodayValue } from '@/modules/program-playground/utils/date.utils'
import { currentReport } from '@/modules/program-playground/hooks/useServerVerification'
import { useFormServerCheck } from '@/modules/program-playground/hooks/useFormServerCheck'
import {
    buildTrackerRegistrationPayload,
    trackerRegistrationValuesSchema,
    type TrackerRegistrationValues,
    withSystemFieldValues,
} from '@/modules/program-playground/utils/trackerPayloads'
import { FormDateField } from './FormDateField'
import { SaveReviewDialog } from './SaveReviewDialog'
import { buildActionTypesByRule } from '@/modules/program-playground/utils/buildActionTypesByRule'
import { omitUndefined } from '@/modules/program-playground/utils/omitUndefined'
import { useSyncFormValue } from '@/modules/program-playground/hooks/useSyncFormValue'
import { validateForm } from '@/modules/program-playground/utils/validateForm'
import { ProgramFormActions } from './ProgramFormActions'
import { RuleFormBody } from './RuleFormBody'
import { parseFormValues } from '@/modules/program-playground/utils/parseFormValues'
import { useOrgUnitGuard } from '@/modules/program-playground/components/orgUnit/ProgramOrgUnitsContext'
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
    const ensureOrgUnit = useOrgUnitGuard(orgUnitId)
    const [review, setReview] = useState<{ values: Record<string, unknown> }>()
    const rulesMetadata = useMemo(
        () => ({ formKind: 'tracker' as const, metadata, programStages }),
        [metadata, programStages]
    )
    const labelLookup = useMemo(
        () => createLabelLookup(rulesMetadata),
        [rulesMetadata]
    )

    const actionTypesByRule = useMemo(
        () => buildActionTypesByRule(metadata.programRules),
        [metadata.programRules]
    )

    useSyncFormValue(form, 'orgUnit', orgUnitId)
    useSyncFormValue(form, 'enrolledAt', enrolledAt)

    // The dry run posts exactly what a save would.
    const buildRegistrationSubmission = (
        resolvedValues: TrackerRegistrationValues
    ) => {
        const values = withSystemFieldValues(
            omitUndefined(resolvedValues),
            form.getValues(),
            REGISTRATION_FORM_SYSTEM_KEYS
        )
        const parsedValues = parseFormValues(
            trackerRegistrationValuesSchema,
            values,
            { formStore, ensureOrgUnit }
        )
        const payload = buildTrackerRegistrationPayload({
            values: parsedValues,
            metadata,
            programId,
        })
        return { values, payload }
    }

    // Opens the read-only summary of the server-side effects.
    const handleReview = () => {
        ensureOrgUnit()
        setReview({ values: form.getValues() })
    }

    const serverCheck = useFormServerCheck({
        form,
        status: 'ACTIVE',
        actionTypesByRule,
        buildPayload: () =>
            buildRegistrationSubmission(form.getValues()).payload,
    })

    return (
        <FormStateProvider<TrackerRegistrationValues>
            formStore={formStore}
            form={form}
        >
            <RuleDevtoolsScope formStore={formStore}>
                <div className="flex h-full w-full flex-1 min-h-0">
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
                        <RuleFormBody
                            rulesMetadata={rulesMetadata}
                            labelLookup={labelLookup}
                            fields={
                                <RegistrationFormFields metadata={metadata} />
                            }
                        >
                            <ProgramFormActions
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
                                submitLabel={i18n.t('Preview server effects')}
                            />
                        </RuleFormBody>
                    </form>
                    <LazyRulesPanel metadata={rulesMetadata} />
                    {review ? (
                        <SaveReviewDialog
                            formStore={formStore}
                            programId={programId}
                            values={review.values}
                            labelLookup={labelLookup}
                            serverReport={
                                currentReport(serverCheck.state)?.verification
                            }
                            onClose={() => {
                                setReview(undefined)
                            }}
                        />
                    ) : null}
                </div>
            </RuleDevtoolsScope>
        </FormStateProvider>
    )
}
