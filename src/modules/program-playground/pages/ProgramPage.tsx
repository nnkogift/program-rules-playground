import '@nnkogift/dhis2-form-utils-devtools/style.css'

import React, { useCallback, useState } from 'react'
import { useLocation, useParams } from 'react-router'
import i18n from '@dhis2/d2-i18n'
import { Center, CircularLoader } from '@dhis2/ui'
import { ProgramContextBar } from '@/modules/program-playground/components/ProgramContextBar'
import { buildProgramListUrl } from '@/modules/program-list/hooks/buildProgramListUrl'
import { useProgramPageData } from '@/modules/program-playground/hooks/useProgramPageData'
import { ProgramOrgUnitsProvider } from '@/modules/program-playground/components/orgUnit/ProgramOrgUnitsContext'
import { useProgramPlaygroundState } from '@/modules/program-playground/hooks/useProgramPlaygroundState'
import { PROGRAM_TYPE, type ProgramListParams } from '@/shared/types/program'
import { parseDhis2Error } from '@/modules/program-playground/utils/parseDhis2Error'
import { OrgUnitsNotice } from './components/OrgUnitsNotice'
import { ProgramFormArea } from './components/ProgramFormArea'
import { ProgramLoadError } from './components/ProgramLoadError'

type ProgramPageLocationState = {
    listParams?: ProgramListParams
}

const HTTP_NOT_FOUND = 404

function isNotFoundError(error: unknown): boolean {
    return parseDhis2Error(error).details?.httpStatusCode === HTTP_NOT_FOUND
}

function resolveBackUrl(state: unknown): string {
    const listParams = (state as ProgramPageLocationState | null)?.listParams
    return listParams ? buildProgramListUrl(listParams) : '/'
}

export function ProgramPage() {
    const { programId } = useParams<{ programId: string }>()
    const location = useLocation()
    const backUrl = resolveBackUrl(location.state)
    const data = useProgramPageData(programId ?? '')
    const { program, error } = data

    if (data.isLoading) {
        return (
            <Center>
                <CircularLoader />
            </Center>
        )
    }

    if (error || !program) {
        const notFound = !error || isNotFoundError(error)
        return <ProgramLoadError backUrl={backUrl} notFound={notFound} />
    }

    return (
        <ProgramPageContent program={program} backUrl={backUrl} data={data} />
    )
}

type ProgramPageData = ReturnType<typeof useProgramPageData>

type ProgramPageContentProps = {
    program: NonNullable<ProgramPageData['program']>
    backUrl: string
    data: ProgramPageData
}

function ProgramPageContent({
    program,
    backUrl,
    data,
}: ProgramPageContentProps) {
    const {
        programOrgUnits,
        orgUnitRootIds,
        hasOrgUnitsError,
        supplementaryData,
        optionGroups,
    } = data
    const {
        orgUnitId,
        setOrgUnitId,
        primaryDate,
        setPrimaryDate,
        resetKey,
        resetPlayground,
    } = useProgramPlaygroundState()
    const [orgUnitAttempted, setOrgUnitAttempted] = useState(false)
    const reportMissingOrgUnit = useCallback(() => {
        setOrgUnitAttempted(true)
    }, [])
    const isTracker = program.programType === PROGRAM_TYPE.WITH_REGISTRATION
    const hasOrgUnits = !hasOrgUnitsError && programOrgUnits.length > 0

    return (
        <div className="flex h-full flex-col">
            <ProgramContextBar
                backUrl={backUrl}
                programName={program.displayName}
                programMeta={formatProgramMeta(
                    isTracker,
                    program.programRules.length
                )}
                orgUnits={programOrgUnits}
                orgUnitRootIds={orgUnitRootIds}
                orgUnitId={orgUnitId}
                showOrgUnitError={orgUnitAttempted && !orgUnitId}
                onOrgUnitChange={setOrgUnitId}
                primaryDateLabel={
                    isTracker ? i18n.t('Enrollment date') : i18n.t('Event date')
                }
                primaryDateValue={primaryDate}
                onPrimaryDateChange={setPrimaryDate}
                onResetPlayground={resetPlayground}
            />
            <div className="flex min-h-0 flex-1 flex-col">
                <OrgUnitsNotice
                    hasError={hasOrgUnitsError}
                    isEmpty={!hasOrgUnitsError && !hasOrgUnits}
                />
                {hasOrgUnits ? (
                    <ProgramOrgUnitsProvider
                        orgUnits={programOrgUnits}
                        rootIds={orgUnitRootIds}
                        reportMissingOrgUnit={reportMissingOrgUnit}
                    >
                        <div className="flex min-h-0 flex-1 flex-col">
                            <ProgramFormArea
                                key={resetKey}
                                program={program}
                                isTracker={isTracker}
                                orgUnitId={orgUnitId}
                                primaryDate={primaryDate}
                                supplementaryData={supplementaryData}
                                optionGroups={optionGroups}
                            />
                        </div>
                    </ProgramOrgUnitsProvider>
                ) : null}
            </div>
        </div>
    )
}

function formatProgramMeta(isTracker: boolean, ruleCount: number): string {
    return i18n.t('{{typeLabel}} · {{count}} rules', {
        typeLabel: isTracker ? i18n.t('Tracker') : i18n.t('Event program'),
        count: ruleCount,
    })
}
