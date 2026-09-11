import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import { Link } from 'react-router'

type ProgramLoadErrorProps = {
    backUrl: string
    notFound: boolean
}

export function ProgramLoadError({ backUrl, notFound }: ProgramLoadErrorProps) {
    return (
        <div className="flex flex-col gap-dp16 pb-dp24">
            <Link
                className="text-dhis2-teal-700 no-underline font-medium hover:underline"
                to={backUrl}
            >
                {i18n.t('Back to programs')}
            </Link>
            <NoticeBox error title={i18n.t('Error')}>
                {notFound
                    ? i18n.t('Program not found')
                    : i18n.t('Could not load this program. Try again later.')}
            </NoticeBox>
        </div>
    )
}
