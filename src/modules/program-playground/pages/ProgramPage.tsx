import '@nnkogift/dhis2-form-utils-devtools/style.css'

import React, { useCallback, useMemo, useState } from 'react'
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

export function ProgramPage() {
    const { programId } = useParams<{ programId: string }>()
    const location = useLocation()
    const listParams = (location.state as ProgramPageLocationState | null)
        ?.listParams
    const backUrl = listParams ? buildProgramListUrl(listParams) : '/'
    const {
        program,
        error,
        isLoading,
        programOrgUnits,
        orgUnitRootIds,
        hasOrgUnitsError,
        supplementaryData,
        optionGroups,
    } = useProgramPageData(programId ?? '')

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
    const isTracker = program?.programType === PROGRAM_TYPE.WITH_REGISTRATION
    const programMeta = useMemo(() => {
        if (!program) {
            return ''
        }
        const typeLabel = isTracker
            ? i18n.t('Tracker')
            : i18n.t('Event program')
        return i18n.t('{{typeLabel}} · {{count}} rules', {
            typeLabel,
            count: program.programRules.length,
        })
    }, [program, isTracker])

    if (isLoading) {
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
        <div className="flex h-full flex-col">
            <ProgramContextBar
                backUrl={backUrl}
                programName={program.displayName}
                programMeta={programMeta}
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
                    isEmpty={!hasOrgUnitsError && programOrgUnits.length === 0}
                />
                {!hasOrgUnitsError && programOrgUnits.length > 0 ? (
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
