import React, { useState } from 'react'
import i18n from '@dhis2/d2-i18n'
import { Button, InputField } from '@dhis2/ui'
import type { ProgramOrgUnit } from '@/modules/program-playground/schemas/programOrgUnits.schema'
import { findProgramOrgUnit } from '@/modules/program-playground/utils/orgUnitTree'
import { OrgUnitSelectorModal } from './OrgUnitSelectorModal'

type OrgUnitSelectorFieldProps = {
    label?: string
    value: string
    onChange: (orgUnitId: string) => void
    onBlur?: () => void
    orgUnits: ProgramOrgUnit[]
    rootIds: string[]
    required?: boolean
    disabled?: boolean
    dense?: boolean
    error?: boolean
    validationText?: string
}

/** Read-only value that opens a modal tree limited to the program's org units. */
export function OrgUnitSelectorField({
    label,
    value,
    onChange,
    onBlur,
    orgUnits,
    rootIds,
    required,
    disabled,
    dense,
    error,
    validationText,
}: OrgUnitSelectorFieldProps) {
    const [open, setOpen] = useState(false)
    const selected = findProgramOrgUnit(orgUnits, value)

    return (
        <div className="flex items-end gap-1.5">
            <div className="min-w-0 flex-1">
                <InputField
                    dense={dense}
                    label={label}
                    required={required}
                    readOnly
                    disabled={disabled}
                    error={error}
                    validationText={validationText}
                    placeholder={i18n.t('Select organisation unit')}
                    value={selected?.displayName ?? ''}
                    onChange={() => undefined}
                    onFocus={() => undefined}
                    onBlur={onBlur}
                />
            </div>
            <Button
                small={dense}
                disabled={disabled}
                onClick={() => {
                    setOpen(true)
                }}
            >
                {selected ? i18n.t('Change') : i18n.t('Select')}
            </Button>
            {selected && !required ? (
                <Button
                    small={dense}
                    secondary
                    disabled={disabled}
                    onClick={() => {
                        onChange('')
                    }}
                >
                    {i18n.t('Clear')}
                </Button>
            ) : null}
            {open ? (
                <OrgUnitSelectorModal
                    orgUnits={orgUnits}
                    rootIds={rootIds}
                    value={value}
                    onSelect={onChange}
                    onClose={() => {
                        setOpen(false)
                        onBlur?.()
                    }}
                />
            ) : null}
        </div>
    )
}
