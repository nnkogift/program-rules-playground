import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'

type OrgUnitsNoticeProps = {
    hasError: boolean
    isEmpty: boolean
}

export function OrgUnitsNotice({ hasError, isEmpty }: OrgUnitsNoticeProps) {
    if (hasError) {
        return (
            <div className="p-dp16">
                <NoticeBox
                    error
                    title={i18n.t('Could not load organisation units')}
                >
                    {i18n.t(
                        'The current user organisation units could not be loaded for data entry.'
                    )}
                </NoticeBox>
            </div>
        )
    }

    if (isEmpty) {
        return (
            <div className="p-dp16">
                <NoticeBox title={i18n.t('No organisation units available')}>
                    {i18n.t(
                        'The current user does not have any accessible organisation units for this playground.'
                    )}
                </NoticeBox>
            </div>
        )
    }

    return null
}
