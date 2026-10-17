import React from 'react'
import { Link } from 'react-router'
import i18n from '@dhis2/d2-i18n'
import { Button, IconArrowLeft16, IconSync16, InputField } from '@dhis2/ui'
import { OrgUnitSelectorField } from '@/modules/program-playground/components/orgUnit/OrgUnitSelectorField'
import type { ProgramOrgUnit } from '@/modules/program-playground/schemas/programOrgUnits.schema'

type ProgramContextBarProps = {
    backUrl: string
    programName: string
    programMeta: string
    orgUnits: ProgramOrgUnit[]
    orgUnitRootIds: string[]
    orgUnitId: string
    showOrgUnitError: boolean
    onOrgUnitChange: (orgUnitId: string) => void
    primaryDateLabel: string
    primaryDateValue: string
    onPrimaryDateChange: (value: string) => void
    onResetPlayground: () => void
}

export function ProgramContextBar({
    backUrl,
    programName,
    programMeta,
    orgUnits,
    orgUnitRootIds,
    orgUnitId,
    showOrgUnitError,
    onOrgUnitChange,
    primaryDateLabel,
    primaryDateValue,
    onPrimaryDateChange,
    onResetPlayground,
}: ProgramContextBarProps) {
    return (
        <div className="flex shrink-0 items-center gap-5 border-b border-dhis2-grey-400 bg-white px-5 py-2.5">
            <Link
                to={backUrl}
                className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-dhis2-teal-700 no-underline hover:underline"
            >
                <IconArrowLeft16 />
                {i18n.t('Programs')}
            </Link>
            <div className="h-7 w-px shrink-0 bg-dhis2-grey-300" />
            <div className="flex min-w-0 flex-col gap-px">
                <span className="truncate text-[15px] font-bold leading-tight text-dhis2-grey-900">
                    {programName}
                </span>
                <span className="text-xs text-dhis2-grey-600">
                    {programMeta}
                </span>
            </div>
            <div className="ml-auto flex shrink-0 items-end gap-dp12">
                <div className="w-[300px]">
                    <OrgUnitSelectorField
                        dense
                        required
                        label={i18n.t('Organisation unit')}
                        value={orgUnitId}
                        orgUnits={orgUnits}
                        rootIds={orgUnitRootIds}
                        error={showOrgUnitError}
                        validationText={
                            showOrgUnitError
                                ? i18n.t('Required to verify or save')
                                : undefined
                        }
                        onChange={onOrgUnitChange}
                    />
                </div>
                <div className="w-[130px]">
                    <InputField
                        dense
                        type="date"
                        label={primaryDateLabel}
                        value={primaryDateValue}
                        onChange={({ value }) => {
                            onPrimaryDateChange(value ?? '')
                        }}
                    />
                </div>
                <Button small icon={<IconSync16 />} onClick={onResetPlayground}>
                    {i18n.t('Reset playground')}
                </Button>
            </div>
        </div>
    )
}
