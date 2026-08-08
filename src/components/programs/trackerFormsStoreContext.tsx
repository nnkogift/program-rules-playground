import { createContext, useContext, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import {
    createTrackerFormsStore,
    type TrackerFormsStore,
} from './trackerFormsStore'

type TrackerFormsStoreApi = ReturnType<typeof createTrackerFormsStore>

const TrackerFormsStoreContext = createContext<TrackerFormsStoreApi | null>(
    null
)

export function TrackerFormsStoreProvider({
    children,
}: {
    children: ReactNode
}) {
    const [store] = useState(() => createTrackerFormsStore())
    return (
        <TrackerFormsStoreContext.Provider value={store}>
            {children}
        </TrackerFormsStoreContext.Provider>
    )
}

export function useTrackerFormsStore<T>(
    selector: (state: TrackerFormsStore) => T
): T {
    const store = useContext(TrackerFormsStoreContext)
    if (!store) {
        throw new Error(
            'useTrackerFormsStore must be used within TrackerFormsStoreProvider'
        )
    }
    return useStore(store, selector)
}
