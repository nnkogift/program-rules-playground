import '@/index.css'

import React, { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { RouteSuspenseFallback } from '@/components/RouteSuspenseFallback'
import { SyncUrlWithGlobalShell } from '@/components/SyncUrlWithGlobalShell'

const ProgramListPage = lazy(() =>
    import('@/pages/ProgramListPage').then((m) => ({
        default: m.ProgramListPage,
    }))
)
const ProgramPage = lazy(() =>
    import('@/pages/ProgramPage').then((m) => ({ default: m.ProgramPage }))
)
const AboutPage = lazy(() => import('@/components/About'))

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
