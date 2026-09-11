import '@/index.css'

import React, { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { RouteSuspenseFallback } from '@/shared/components/RouteSuspenseFallback'
import { SyncUrlWithGlobalShell } from '@/SyncUrlWithGlobalShell'

const ProgramListPage = lazy(() =>
    import('@/modules/program-list/pages/ProgramListPage').then((m) => ({
        default: m.ProgramListPage,
    }))
)
const ProgramPage = lazy(() =>
    import('@/modules/program-playground/pages/ProgramPage').then((m) => ({
        default: m.ProgramPage,
    }))
)
const AboutPage = lazy(() =>
    import('@/About').then((m) => ({ default: m.AboutPage }))
)

const AppWrapper = () => {
    return (
        <div className="h-full">
            <HashRouter>
                <SyncUrlWithGlobalShell />
                <Suspense fallback={<RouteSuspenseFallback />}>
                    <Routes>
                        <Route path="/" element={<ProgramListPage />} />
                        <Route
                            path="/programs/:programId"
                            element={<ProgramPage />}
                        />
                        <Route path="/about" element={<AboutPage />} />
                    </Routes>
                </Suspense>
            </HashRouter>
        </div>
    )
}

export default AppWrapper
