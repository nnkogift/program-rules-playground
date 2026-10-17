import { type ComponentProps, lazy, Suspense } from 'react'
import { RouteSuspenseFallback } from '@/shared/components/RouteSuspenseFallback'

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

type ShellProps = ComponentProps<typeof TrackerProgramShell>

type ProgramFormAreaProps = {
    program: ShellProps['program']
    isTracker: boolean
    orgUnitId: ShellProps['orgUnitId']
    /** Enrollment date (tracker) or event date (event program). */
    primaryDate: string
    supplementaryData: ShellProps['supplementaryData']
    optionGroups: ShellProps['optionGroups']
}

export function ProgramFormArea({
    program,
    isTracker,
    orgUnitId,
    primaryDate,
    supplementaryData,
    optionGroups,
}: ProgramFormAreaProps) {
    return (
        <Suspense fallback={<RouteSuspenseFallback />}>
            {isTracker ? (
                <TrackerProgramShell
                    program={program}
                    programId={program.id}
                    orgUnitId={orgUnitId}
                    enrolledAt={primaryDate}
                    supplementaryData={supplementaryData}
                    optionGroups={optionGroups}
                />
            ) : (
                <ProgramStageFormScreen
                    program={program}
                    programStageId={program.programStages?.[0]?.id}
                    orgUnitId={orgUnitId}
                    occurredAt={primaryDate}
                    supplementaryData={supplementaryData}
                    optionGroups={optionGroups}
                />
            )}
        </Suspense>
    )
}
