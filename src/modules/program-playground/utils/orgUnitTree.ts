import type { ProgramOrgUnit } from '@/modules/program-playground/schemas/programOrgUnits.schema'

const PATH_SEPARATOR = '/'

function pathSegments(path: string): string[] {
    return path.split(PATH_SEPARATOR).filter(Boolean)
}

/**
 * Tree roots: the user's accessible org units that lead to a program org unit.
 * Falls back to the program org units themselves when none of the user's
 * roots is an ancestor (so the tree never renders empty).
 */
export function getTreeRoots(
    programOrgUnits: ProgramOrgUnit[],
    accessibleIds: string[]
): string[] {
    const ancestorIds = new Set(
        programOrgUnits.flatMap((orgUnit) => pathSegments(orgUnit.path))
    )
    const roots = accessibleIds.filter((id) => ancestorIds.has(id))
    if (roots.length > 0) {
        return roots
    }
    return programOrgUnits.map((orgUnit) => orgUnit.id)
}

export function getSelectableIds(programOrgUnits: ProgramOrgUnit[]) {
    return new Set(programOrgUnits.map((orgUnit) => orgUnit.id))
}

/** Case-insensitive name search over the program org units. */
export function searchProgramOrgUnits(
    programOrgUnits: ProgramOrgUnit[],
    term: string
): ProgramOrgUnit[] {
    const normalized = term.trim().toLowerCase()
    if (!normalized) {
        return []
    }
    return programOrgUnits.filter((orgUnit) =>
        orgUnit.displayName.toLowerCase().includes(normalized)
    )
}

/** Paths of every ancestor of the given org units, so the tree opens down to them. */
export function getAncestorPaths(orgUnits: ProgramOrgUnit[]): string[] {
    const paths = new Set<string>()
    for (const { path } of orgUnits) {
        const segments = pathSegments(path)
        for (let depth = 1; depth < segments.length; depth += 1) {
            paths.add(
                `${PATH_SEPARATOR}${segments.slice(0, depth).join(PATH_SEPARATOR)}`
            )
        }
    }
    return [...paths]
}

export function findProgramOrgUnit(
    programOrgUnits: ProgramOrgUnit[],
    id: string
): ProgramOrgUnit | undefined {
    return programOrgUnits.find((orgUnit) => orgUnit.id === id)
}
