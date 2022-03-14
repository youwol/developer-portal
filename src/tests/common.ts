import { PyYouwol } from '@youwol/http-clients'
import { mergeMap } from 'rxjs/operators'

export function getPyYouwolBasePath() {
    return 'http://localhost:2001'
}

export function resetPyYouwolDbs$() {
    const client = new PyYouwol.PyYouwolClient()
    return client.admin.environment
        .login$({ email: 'int_tests_yw-users@test-user' })
        .pipe(mergeMap(() => client.admin.customCommands.doGet$('reset')))
}

export function expectAttributes(
    resp,
    attributes: Array<string | [string, unknown]>,
) {
    attributes.forEach((att) => {
        if (Array.isArray(att)) {
            expect(resp[att[0]]).toEqual(att[1])
        } else {
            expect(resp[att]).toBeTruthy()
        }
    })
}

type VDomType<U, T> = U & T & { vDom: T }

export function getFromDocument<T, U = HTMLDivElement>(
    selector: string,
    findFct: (d: VDomType<U, T>) => boolean = () => true,
): VDomType<U, T> {
    const views = document.querySelectorAll(selector) as unknown as VDomType<
        U,
        T
    >[]
    return Array.from(views).find((t) => findFct(t)) as unknown as VDomType<
        U,
        T
    >
}

export function queryFromDocument<T, U = HTMLDivElement>(
    selector: string,
    filterFct: (d: VDomType<U, T>) => boolean = () => true,
): VDomType<U, T>[] {
    const views = document.querySelectorAll(selector) as unknown as VDomType<
        U,
        T
    >[]
    return Array.from(views).filter((v: VDomType<U, T>) =>
        filterFct(v),
    ) as unknown as VDomType<U, T>[]
}
