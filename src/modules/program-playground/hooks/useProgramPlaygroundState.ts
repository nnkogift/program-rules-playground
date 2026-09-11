import { useState } from 'react'
import { createTodayValue } from '@/modules/program-playground/utils/date.utils'

/** Local playground input state (org unit / primary date / reset counter) for `ProgramPage`. */
export function useProgramPlaygroundState() {
    const [orgUnitId, setOrgUnitId] = useState('')
    const [primaryDate, setPrimaryDate] = useState(createTodayValue)
    const [resetKey, setResetKey] = useState(0)

    const resetPlayground = () => {
        setOrgUnitId('')
        setPrimaryDate(createTodayValue())
        setResetKey((key) => key + 1)
    }

    return {
        orgUnitId,
        setOrgUnitId,
        primaryDate,
        setPrimaryDate,
        resetKey,
        resetPlayground,
    }
}
