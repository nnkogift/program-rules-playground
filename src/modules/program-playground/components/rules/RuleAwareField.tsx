import i18n from '@dhis2/d2-i18n'
import { D2FieldWidget } from '@nnkogift/dhis2-form-utils-dhis2-ui'
import {
    type FieldControlInput,
    useFieldControl,
    useFieldRuleEffect,
    useFieldState,
} from '@nnkogift/dhis2-form-utils-hooks'
import { memo, useId } from 'react'
import { useWatch } from 'react-hook-form'
import { ProgramRuleActionType } from '@nnkogift/dhis2-form-utils-metadata'
import { OrgUnitSelectorField } from '@/modules/program-playground/components/orgUnit/OrgUnitSelectorField'
import { useWidgetAriaLabel } from '@/modules/program-playground/hooks/useWidgetAriaLabel'
import { resolveOnCompleteMessage } from '@/modules/program-playground/utils/resolveOnCompleteMessage'
import { useProgramOrgUnitsContext } from '@/modules/program-playground/components/orgUnit/ProgramOrgUnitsContext'
import type { OnCompleteMessage } from '@/modules/program-playground/utils/resolveOnCompleteMessage'
import { FieldEffectBadge } from './FieldEffectBadge'
import { HiddenFieldPlaceholder } from './HiddenFieldPlaceholder'
import { useRuleDisplay } from './RuleDisplayContext'

type RuleAwareFieldProps = {
    field: FieldControlInput
}

export const RuleAwareField = memo(function RuleAwareField({
    field,
}: RuleAwareFieldProps) {
    const control = useFieldControl(field)
    const ruleEffect = useFieldRuleEffect(control.fieldId)
    const fieldState = useFieldState(control.fieldId)
    const status = useWatch({ name: 'status' })
    const { ghostsEnabled, labelLookup } = useRuleDisplay()
    const labelId = useId()
    const programOrgUnits = useProgramOrgUnitsContext()
    const widgetContainerRef = useWidgetAriaLabel(labelId)

    if (control.isHidden && !ghostsEnabled) {
        return null
    }

    const ruleName = ruleEffect
        ? labelLookup.resolveRuleName(ruleEffect.ruleId)
        : null
    const onComplete = resolveOnCompleteMessage(status, fieldState)
    const widgetControl = {
        ...control,
        fieldConfig: { ...control.fieldConfig, label: '' },
    }

    return (
        <div
            className="flex min-w-0 flex-col gap-1.5"
            data-field-id={control.fieldId}
        >
            <FieldLabelRow
                labelId={labelId}
                label={control.fieldConfig.label}
                isHidden={control.isHidden}
                isMandatory={control.isMandatory}
                ruleEffect={ruleEffect}
                ruleName={ruleName}
                onComplete={onComplete}
            />
            {control.isHidden ? (
                <HiddenFieldPlaceholder
                    ruleName={ruleName ?? i18n.t('a rule')}
                />
            ) : (
                <div ref={widgetContainerRef}>
                    <FieldWidget
                        control={control}
                        widgetControl={widgetControl}
                        programOrgUnits={programOrgUnits}
                    />
                </div>
            )}
            {onComplete ? <OnCompleteNote message={onComplete} /> : null}
        </div>
    )
})

type OnCompleteNoteProps = {
    message: OnCompleteMessage
}

function OnCompleteNote({ message }: OnCompleteNoteProps) {
    const tone =
        message.kind === 'error'
            ? 'border-dhis2-red-600 text-dhis2-red-800'
            : 'border-dhis2-yellow-600 text-dhis2-grey-900'
    return (
        <p
            className={`m-0 border-l-2 border-dashed pl-2 text-xs leading-4 ${tone}`}
        >
            <span className="font-semibold">
                {i18n.t('On complete')}
                {': '}
            </span>
            {message.text}
        </p>
    )
}

type FieldWidgetProps = {
    control: ReturnType<typeof useFieldControl>
    widgetControl: ReturnType<typeof useFieldControl>
    programOrgUnits: ReturnType<typeof useProgramOrgUnitsContext>
}

function FieldWidget({
    control,
    widgetControl,
    programOrgUnits,
}: FieldWidgetProps) {
    if (control.widgetKind === 'orgUnit' && programOrgUnits) {
        return (
            <OrgUnitWidget
                control={control}
                programOrgUnits={programOrgUnits}
            />
        )
    }
    return <D2FieldWidget control={widgetControl} />
}

type OrgUnitWidgetProps = {
    control: ReturnType<typeof useFieldControl>
    programOrgUnits: NonNullable<ReturnType<typeof useProgramOrgUnitsContext>>
}

function OrgUnitWidget({ control, programOrgUnits }: OrgUnitWidgetProps) {
    return (
        <OrgUnitSelectorField
            value={String(control.field.value ?? '')}
            onChange={control.field.onChange}
            onBlur={control.field.onBlur}
            orgUnits={programOrgUnits.orgUnits}
            rootIds={programOrgUnits.rootIds}
            disabled={control.isDisabled}
            error={control.hasError}
            validationText={control.errorMessage ?? control.warningMessage}
        />
    )
}

const ON_COMPLETE_ACTION_TYPES: ReadonlySet<string> = new Set([
    ProgramRuleActionType.ERRORONCOMPLETE,
    ProgramRuleActionType.WARNINGONCOMPLETE,
])

type FieldLabelRowProps = {
    labelId: string
    label: string
    isHidden: boolean
    isMandatory: boolean
    ruleEffect: ReturnType<typeof useFieldRuleEffect>
    ruleName: string | null
    onComplete: OnCompleteMessage | null
}

function FieldLabelRow({
    labelId,
    label,
    isHidden,
    isMandatory,
    ruleEffect,
    ruleName,
    onComplete,
}: FieldLabelRowProps) {
    const effectIsOnComplete = ON_COMPLETE_ACTION_TYPES.has(
        ruleEffect?.ruleActionType ?? ''
    )
    const showCompletionBadge = onComplete && !effectIsOnComplete

    return (
        <div className="flex min-w-0 items-center gap-2">
            <span
                id={labelId}
                className={`text-sm leading-5 ${isHidden ? 'text-dhis2-grey-600' : 'text-dhis2-grey-900'}`}
            >
                {label}
                {isMandatory ? '*' : ''}
            </span>
            {ruleEffect && ruleName ? (
                <FieldEffectBadge
                    onComplete={effectIsOnComplete}
                    actionType={ruleEffect.ruleActionType}
                    ruleName={ruleName}
                />
            ) : null}
            {showCompletionBadge ? (
                <FieldEffectBadge
                    onComplete
                    actionType={
                        onComplete.kind === 'error'
                            ? ProgramRuleActionType.ERRORONCOMPLETE
                            : ProgramRuleActionType.WARNINGONCOMPLETE
                    }
                    ruleName={i18n.t('completion pass')}
                />
            ) : null}
        </div>
    )
}
