import React from 'react'
import { Link } from 'react-router'
import i18n from '@dhis2/d2-i18n'
import { DOCS_URL } from '@/shared/constants/links'

const linkClass = 'text-dhis2-blue-700 hover:underline'

export function ProgramListHelpLinks() {
    return (
        <nav
            aria-label={i18n.t('Help')}
            className="flex items-center justify-end gap-dp16 mt-auto pt-dp16 text-sm"
        >
            <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
            >
                {i18n.t('Docs')}
                <span className="sr-only">
                    {i18n.t('(opens in a new tab)')}
                </span>
            </a>
            <Link to="/about" className={linkClass}>
                {i18n.t('About')}
            </Link>
        </nav>
    )
}
