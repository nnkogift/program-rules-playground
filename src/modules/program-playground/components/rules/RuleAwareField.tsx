import i18n from '@dhis2/d2-i18n'
import { D2FieldWidget } from '@nnkogift/dhis2-form-utils-dhis2-ui'
import {
    type FieldControlInput,
    useFieldControl,
    useFieldRuleEffect,
    useFieldState,
} from '@nnkogift/dhis2-form-utils-hooks'
import { memo, useEffect, useId, useRef } from 'react'
import { useWatch } from 'react-hook-form'
import { ProgramRuleActionType } from '@nnkogift/dhis2-form-utils-metadata'
import { FieldEffectBadge } from './FieldEffectBadge'
import { HiddenFieldPlaceholder } from './HiddenFieldPlaceholder'
import { useRuleDisplay } from './RuleDisplayContext'

type RuleAwareFieldProps = {
    field: FieldControlInput
}

// Matches the interactive element every D2*Field widget ultimately renders:
// InputField/TextAreaField-based widgets render <input>/<textarea>, the custom
// SingleSelectField renders this data-test'd div. A <fieldset> (the radio-group
// render hint) is excluded — its own <legend> already names the group natively.
const WIDGET_TARGET_SELECTOR =
    'input, textarea, [data-test="dhis2-uicore-select-input"]'

export const RuleAwareField = memo(function RuleAwareField({
    field,
}: RuleAwareFieldProps) {
    const control = useFieldControl(field)
    const ruleEffect = useFieldRuleEffect(control.fieldId)
    const fieldState = useFieldState(control.fieldId)
    const status = useWatch({ name: 'status' })
    const { ghostsEnabled, labelLookup } = useRuleDisplay()
    const labelId = useId()
    const widgetContainerRef = useRef<HTMLDivElement>(null)

    // The widget below has its own `fieldConfig.label` blanked (see widgetControl) so it
    // doesn't render a second, visually duplicate label — this row is the only visible
    // label. @dhis2/ui's field components don't accept an aria-label/aria-labelledby prop,
    // so once the label is blanked they render no accessible name at all for the
    // underlying input. Restore it by wiring aria-labelledby to this span directly on
    // whichever interactive element the widget actually rendered.
    useEffect(() => {
        const container = widgetContainerRef.current
        if (!container || container.querySelector('fieldset')) {
            return
        }
        container
            .querySelector<HTMLElement>(WIDGET_TARGET_SELECTOR)
            ?.setAttribute('aria-labelledby', labelId)
    })

    if (control.isHidden && !ghostsEnabled) {
        return null
    }

    const ruleName = ruleEffect
        ? labelLookup.resolveRuleName(ruleEffect.ruleId)
        : null
    const label = control.fieldConfig.label
    const effectIsOnComplete =
        ruleEffect?.ruleActionType === ProgramRuleActionType.ERRORONCOMPLETE ||
        ruleEffect?.ruleActionType === ProgramRuleActionType.WARNINGONCOMPLETE
    const onCompleteError =
        status === 'COMPLETED' ? fieldState?.errorOnComplete : null
    const onCompleteWarning =
        status === 'COMPLETED' && !onCompleteError
            ? fieldState?.warningOnComplete
            : null
    const onCompleteMessage = onCompleteError ?? onCompleteWarning
    const widgetControl = {
        ...control,
        fieldConfig: { ...control.fieldConfig, label: '' },
    }

    return (
        <div
            className="flex min-w-0 flex-col gap-1.5"
            data-field-id={control.fieldId}
        >
            <div className="flex min-w-0 items-center gap-2">
                <span
                    id={labelId}
                    className={`text-sm leading-5 ${control.isHidden ? 'text-dhis2-grey-600' : 'text-dhis2-grey-900'}`}
                >
                    {label}
                    {control.isMandatory ? '*' : ''}
                </span>
                {ruleEffect && ruleName ? (
                    <FieldEffectBadge
                        onComplete={effectIsOnComplete}
                        actionType={ruleEffect.ruleActionType}
                        ruleName={ruleName}
                    />
                ) : null}
                {onCompleteMessage && !effectIsOnComplete ? (
                    <FieldEffectBadge
                        onComplete
                        actionType={
                            onCompleteError
                                ? ProgramRuleActionType.ERRORONCOMPLETE
                                : ProgramRuleActionType.WARNINGONCOMPLETE
                        }
                        ruleName={i18n.t('completion pass')}
                    />
                ) : null}
            </div>
            {control.isHidden ? (
                <HiddenFieldPlaceholder
                    ruleName={ruleName ?? i18n.t('a rule')}
                />
            ) : (
                <div ref={widgetContainerRef}>
                    <D2FieldWidget control={widgetControl} />
                </div>
            )}
            {onCompleteMessage ? (
                <p
                    className={`m-0 border-l-2 border-dashed pl-2 text-xs leading-4 ${onCompleteError ? 'border-dhis2-red-600 text-dhis2-red-800' : 'border-dhis2-yellow-600 text-dhis2-grey-900'}`}
                >
                    <span className="font-semibold">
                        {i18n.t('On complete')}
                        {': '}
                    </span>
                    {onCompleteMessage}
                </p>
            ) : null}
        </div>
    )
})
