import '@nnkogift/dhis2-form-utils-devtools/style.css'

import React, { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router'
import i18n from '@dhis2/d2-i18n'
import { Center, CircularLoader } from '@dhis2/ui'
import { useEventProgramMetadataQuery } from '@nnkogift/dhis2-form-utils-hooks'
import { ProgramContextBar } from '@/modules/program-playground/components/ProgramContextBar'
import { RouteSuspenseFallback } from '@/shared/components/RouteSuspenseFallback'
import { buildProgramListUrl } from '@/modules/program-list/hooks/buildProgramListUrl'
import { useAccessibleOrgUnits } from '@/modules/program-playground/hooks/useAccessibleOrgUnits'
import { ProgramOrgUnitsProvider } from '@/modules/program-playground/components/orgUnit/ProgramOrgUnitsContext'
import { useProgramOrgUnits } from '@/modules/program-playground/hooks/useProgramOrgUnits'
import { getTreeRoots } from '@/modules/program-playground/utils/orgUnitTree'
import { useCurrentUserSupplementaryData } from '@/modules/program-playground/hooks/useCurrentUserSupplementaryData'
import { useOptionGroupsSupplementaryData } from '@/modules/program-playground/hooks/useOptionGroupsSupplementaryData'
import { useProgramPlaygroundState } from '@/modules/program-playground/hooks/useProgramPlaygroundState'
import { PROGRAM_TYPE, type ProgramListParams } from '@/shared/types/program'
import { parseDhis2Error } from '@/modules/program-playground/utils/parseDhis2Error'
import { OrgUnitsNotice } from './components/OrgUnitsNotice'
import { ProgramLoadError } from './components/ProgramLoadError'

const TrackerProgramShell = lazy(() =>
    import('@/modules/program-playground/components/forms/TrackerProgramShell').then(
        (m) => ({
            default: m.TrackerProgramShell,
        })
    )
)
const ProgramStageFormScreen = lazy(() =>
    import('@/modules/program-playground/components/forms/ProgramStageFormScreen').then(
        (m) => ({
            default: m.ProgramStageFormScreen,
        })
    )
)

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
        metadata: program,
        error,
        loading,
    } = useEventProgramMetadataQuery(programId ?? '')
    const {
        orgUnits: accessibleOrgUnits,
        loading: orgUnitsLoading,
        error: orgUnitsError,
    } = useAccessibleOrgUnits()
    const {
        orgUnits: programOrgUnits,
        loading: programOrgUnitsLoading,
        error: programOrgUnitsError,
    } = useProgramOrgUnits(programId ?? '')
    const orgUnitRootIds = useMemo(
        () =>
            getTreeRoots(
                programOrgUnits,
                accessibleOrgUnits.map((orgUnit) => orgUnit.id)
            ),
        [programOrgUnits, accessibleOrgUnits]
    )
    const supplementaryData = useCurrentUserSupplementaryData()
    const optionGroups = useOptionGroupsSupplementaryData(
        program?.programRules ?? []
    )

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
    const hasOrgUnitsError = Boolean(orgUnitsError || programOrgUnitsError)
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

    if (loading || orgUnitsLoading || programOrgUnitsLoading) {
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
                            <Suspense fallback={<RouteSuspenseFallback />}>
                                {isTracker ? (
                                    <TrackerProgramShell
                                        key={resetKey}
                                        program={program}
                                        programId={program.id}
                                        orgUnitId={orgUnitId}
                                        enrolledAt={primaryDate}
                                        supplementaryData={supplementaryData}
                                        optionGroups={optionGroups}
                                    />
                                ) : (
                                    <ProgramStageFormScreen
                                        key={resetKey}
                                        program={program}
                                        programStageId={
                                            program.programStages?.[0]?.id
                                        }
                                        orgUnitId={orgUnitId}
                                        occurredAt={primaryDate}
                                        supplementaryData={supplementaryData}
                                        optionGroups={optionGroups}
                                    />
                                )}
                            </Suspense>
                        </div>
                    </ProgramOrgUnitsProvider>
                ) : null}
            </div>
        </div>
    )
}
