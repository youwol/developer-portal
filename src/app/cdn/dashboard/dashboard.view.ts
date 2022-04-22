import { VirtualDOM } from '@youwol/flux-view'
import { map } from 'rxjs/operators'
import { CdnState } from '../cdn.state'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { DashboardTemplateView } from '../../common/utils-view'

export class DashboardView extends DashboardTemplateView<
    pyYw.CdnPackage,
    CdnState
> {
    public readonly id: string = 'dashboard'
    public readonly class = 'w-100 h-100'

    public readonly style = {
        maxHeight: '100%',
        height: 'fit-content',
    }

    public readonly children: VirtualDOM[]

    constructor(params: { cdnState: CdnState }) {
        super({
            state: params.cdnState,
            dataSource$: params.cdnState.status$.pipe(
                map((status: any) => status.data.packages),
            ),
            cardView: (data) => {
                return new PackageSnippetView({
                    cdnState: params.cdnState,
                    package: data,
                })
            },
        })
    }
}

export class PackageSnippetView implements VirtualDOM {
    public readonly children: VirtualDOM[]
    public readonly package: pyYw.CdnPackage
    public readonly cdnState: CdnState
    public readonly onclick = () => {
        this.cdnState.openPackage(this.package)
    }
    constructor(params: { cdnState: CdnState; package: pyYw.CdnPackage }) {
        Object.assign(this, params)
        this.children = [
            { tag: 'h4', innerText: this.package.name },
            {
                innerText: `latest version: ${
                    this.package.versions.slice(-1)[0].version
                }`,
            },
            {
                innerText: `${this.package.versions.length} versions`,
            },
        ]
    }
}
