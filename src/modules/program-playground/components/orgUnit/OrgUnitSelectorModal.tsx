import React, { useMemo, useState } from 'react'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    InputField,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    OrganisationUnitTree,
} from '@dhis2/ui'
import type { ProgramOrgUnit } from '@/modules/program-playground/schemas/programOrgUnits.schema'
import {
    findProgramOrgUnit,
    getAncestorPaths,
    getSelectableIds,
    searchProgramOrgUnits,
} from '@/modules/program-playground/utils/orgUnitTree'

type OrgUnitSelectorModalProps = {
    orgUnits: ProgramOrgUnit[]
    rootIds: string[]
    value: string
    onSelect: (orgUnitId: string) => void
    onClose: () => void
}

export function OrgUnitSelectorModal({
    orgUnits,
    rootIds,
    value,
    onSelect,
    onClose,
}: OrgUnitSelectorModalProps) {
    const [search, setSearch] = useState('')
    const [pendingId, setPendingId] = useState(value)
    const selectableIds = useMemo(() => getSelectableIds(orgUnits), [orgUnits])
    const matches = useMemo(
        () => searchProgramOrgUnits(orgUnits, search),
        [orgUnits, search]
    )
    const isSearching = search.trim().length > 0
    const visibleOrgUnits = isSearching ? matches : orgUnits
    const pending = findProgramOrgUnit(orgUnits, pendingId)
    const initiallyExpanded = useMemo(
        () => getAncestorPaths(visibleOrgUnits),
        [visibleOrgUnits]
    )

    return (
        <Modal onClose={onClose} position="middle" large>
            <ModalTitle>{i18n.t('Select organisation unit')}</ModalTitle>
            <ModalContent>
                <div className="min-h-[500px]">
                    <InputField
                        dense
                        label={i18n.t('Search')}
                        placeholder={i18n.t(
                            'Search program organisation units'
                        )}
                        value={search}
                        onChange={({ value: next }) => {
                            setSearch(next ?? '')
                        }}
                    />
                    <p className="mb-2 mt-3 text-xs text-dhis2-grey-600">
                        {i18n.t(
                            'Only organisation units assigned to this program can be selected.'
                        )}
                    </p>
                    {visibleOrgUnits.length === 0 ? (
                        <p className="text-sm text-dhis2-grey-700">
                            {i18n.t('No matching organisation units')}
                        </p>
                    ) : (
                        <OrganisationUnitTree
                            key={search.trim()}
                            roots={rootIds}
                            singleSelection
                            filter={visibleOrgUnits.map(
                                (orgUnit) => orgUnit.path
                            )}
                            initiallyExpanded={initiallyExpanded}
                            selected={pending ? [pending.path] : []}
                            highlighted={matches.map((orgUnit) => orgUnit.path)}
                            renderNodeLabel={({ node, label, selected }) => {
                                const isSelectable = selectableIds.has(node.id)
                                // The tree paints the selected node with a dark teal
                                // background, so its label must be light to stay legible.
                                const tone = !isSelectable
                                    ? 'cursor-default text-dhis2-grey-600'
                                    : selected.includes(node.path)
                                      ? 'cursor-pointer text-white'
                                      : 'cursor-pointer text-dhis2-grey-900'
                                return (
                                    <span
                                        className={tone}
                                        title={
                                            isSelectable
                                                ? undefined
                                                : i18n.t(
                                                      'Not assigned to this program'
                                                  )
                                        }
                                    >
                                        {label}
                                    </span>
                                )
                            }}
                            onChange={({ id }) => {
                                if (selectableIds.has(id)) {
                                    setPendingId(id)
                                }
                            }}
                        />
                    )}
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button secondary onClick={onClose}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        disabled={!pending}
                        onClick={() => {
                            onSelect(pendingId)
                            onClose()
                        }}
                    >
                        {pending
                            ? i18n.t('Select {{name}}', {
                                  name: pending.displayName,
                              })
                            : i18n.t('Select')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
