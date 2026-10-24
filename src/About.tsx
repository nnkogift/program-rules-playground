import React from 'react'
import { Link } from 'react-router'
import { useConfig } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    BUG_REPORT_URL,
    DOCS_URL,
    FORM_UTILS_URL,
    GITHUB_URL,
    SUPPORTED_DHIS2_RANGE,
} from '@/shared/constants/links'

const linkClass =
    'flex items-start justify-between gap-dp16 min-h-11 px-dp16 py-dp12 text-dhis2-grey-900 no-underline hover:bg-dhis2-grey-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-dhis2-blue-600'

function ExternalLinkIcon() {
    return (
        <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0 text-dhis2-grey-600"
        >
            <path d="M9 2h5v5M14 2L7.5 8.5M12 9.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3.5" />
        </svg>
    )
}

function ResourceLink({
    href,
    title,
    description,
}: {
    href: string
    title: string
    description: string
}) {
    return (
        <li>
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
            >
                <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-dhis2-blue-700">
                        {title}
                    </span>
                    <span className="text-sm text-dhis2-grey-700">
                        {description}
                    </span>
                </span>
                <ExternalLinkIcon />
                <span className="sr-only">
                    {i18n.t('(opens in a new tab)')}
                </span>
            </a>
        </li>
    )
}

function Fact({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-dhis2-grey-600">
                {label}
            </dt>
            <dd className="m-0 text-base text-dhis2-grey-900">{value}</dd>
        </div>
    )
}

export function AboutPage() {
    const { appVersion } = useConfig()
    const version = appVersion?.full ?? i18n.t('Unknown')

    return (
        <div className="flex flex-col max-w-3xl w-full mx-auto px-dp16 sm:px-dp32 pt-7 pb-12 gap-dp24">
            <Link
                to="/"
                className="self-start text-sm text-dhis2-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-dhis2-blue-600"
            >
                {i18n.t('← Back to programs')}
            </Link>

            <header className="flex flex-col gap-1">
                <h1 className="m-0 text-2xl font-medium leading-[1.3] text-dhis2-grey-900">
                    {i18n.t('Program Rules Playground')}
                </h1>
                <p className="m-0 text-sm text-dhis2-grey-700">
                    {i18n.t(
                        'View, test and debug program rules in your DHIS2 instance.'
                    )}
                </p>
            </header>

            <dl className="m-0 grid grid-cols-1 sm:grid-cols-2 gap-dp16 p-dp16 bg-white border border-dhis2-grey-400 rounded-md">
                <Fact label={i18n.t('Version')} value={version} />
                <Fact
                    label={i18n.t('Supported DHIS2')}
                    value={SUPPORTED_DHIS2_RANGE}
                />
            </dl>

            <section
                aria-labelledby="about-links"
                className="flex flex-col gap-dp8"
            >
                <h2
                    id="about-links"
                    className="m-0 text-base font-medium text-dhis2-grey-900"
                >
                    {i18n.t('Resources')}
                </h2>
                <ul className="m-0 p-0 list-none bg-white border border-dhis2-grey-400 rounded-md divide-y divide-dhis2-grey-300 overflow-hidden">
                    <ResourceLink
                        href={DOCS_URL}
                        title={i18n.t('Documentation')}
                        description={i18n.t('Guides and reference')}
                    />
                    <ResourceLink
                        href={GITHUB_URL}
                        title={i18n.t('GitHub repository')}
                        description={i18n.t('Source code and releases')}
                    />
                    <ResourceLink
                        href={BUG_REPORT_URL}
                        title={i18n.t('Report a bug')}
                        description={i18n.t('Open an issue on GitHub')}
                    />
                    <ResourceLink
                        href={FORM_UTILS_URL}
                        title="dhis2-form-utils"
                        description={i18n.t(
                            'The rule engine and form libraries this app is built on'
                        )}
                    />
                </ul>
            </section>
        </div>
    )
}
