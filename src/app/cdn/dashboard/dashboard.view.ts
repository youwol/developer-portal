import { VirtualDOM } from '@youwol/flux-view'
import { map } from 'rxjs/operators'
import { CdnState, ActualPackage } from '../cdn.state'
import { DashboardTemplateView } from '../../common'

/**
 * @category View
 */
export class DashboardView extends DashboardTemplateView<
    ActualPackage,
    CdnState
> {
    constructor(params: { cdnState: CdnState }) {
        super({
            state: params.cdnState,
            dataSource$: params.cdnState.packages$.pipe(
                map((packages) =>
                    packages.filter((p) => p instanceof ActualPackage),
                ),
                map((d) => d as ActualPackage[]),
            ),
            cardView: (data) => {
                return new PackageSnippetView({
                    cdnState: params.cdnState,
                    package: data,
                })
            },
        })

        params.cdnState.cdnClient.getStatus$().subscribe()
    }
}

/**
 * @category View
 */
export class PackageSnippetView implements VirtualDOM {

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group Immutable Constants
     */
    public readonly package: ActualPackage

    /**
     * @group States
     */
    public readonly cdnState: CdnState

    /**
     * @group Immutable DOM Constants
     */
    public readonly onclick = () => {
        this.cdnState.openPackage(this.package.id)
    }
    constructor(params: { cdnState: CdnState; package: ActualPackage }) {
        Object.assign(this, params)
        this.children = [
            { tag: 'h4', innerText: this.package.name },
            {
                innerText: `latest version: ${
                    this.package.versions.slice(-1)[0]
                }`,
            },
            {
                innerText: `${this.package.versions.length} versions`,
            },
        ]
    }
}
