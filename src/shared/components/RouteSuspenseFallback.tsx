import { Center, CircularLoader } from '@dhis2/ui'

export function RouteSuspenseFallback() {
    return (
        <Center>
            <CircularLoader />
        </Center>
    )
}
