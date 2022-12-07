import { child$, VirtualDOM } from '@youwol/flux-view'
import { CdnState } from '../cdn.state'
import { basic } from '@youwol/installers-youwol'

import { AssetsBackend } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'
import { BehaviorSubject } from 'rxjs'
import { AssetLightDescription } from '@youwol/os-core'

/**
 * @category View
 */
export class PackageView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly cdnState: CdnState

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex flex-column h-100'

    /**
     * @group Immutable Constants
     */
    public readonly packageId: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]
    constructor(params: { cdnState: CdnState; packageId: string }) {
        Object.assign(this, params)
        this.children = [
            {
                class: 'border-bottom mx-auto mb-2',
                innerText: window.atob(this.packageId),
                style: {
                    fontSize: '25px',
                    width: 'fit-content',
                },
            },
            child$(
                this.cdnState.packagesEvent[this.packageId].info$,
                (packageInfo) =>
                    new VersionsView({
                        cdnState: this.cdnState,
                        package: packageInfo,
                    }),
            ),
            child$(
                new AssetsBackend.AssetsClient()
                    .getAsset$({ assetId: window.btoa(this.packageId) })
                    .pipe(raiseHTTPErrors()),
                (asset) => {
                    return {
                        class: 'flex-grow-1',
                        style: { minHeight: '0px' },
                        children: [
                            new basic.PackageInfoView({
                                asset: {
                                    ...asset,
                                    rawId: this.packageId,
                                } as AssetLightDescription,
                            }),
                        ],
                    }
                },
            ),
        ]
    }
}

/**
 * @category View
 */
export class VersionsView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: Array<VirtualDOM>

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'overflow-auto mx-auto'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        maxHeight: '50%',
    }

    /**
     * @group Immutable Constants
     */
    public readonly package: pyYw.Routers.LocalCdn.CdnPackage

    /**
     * @group Observables
     */
    public readonly selectedVersion$ = new BehaviorSubject<string>(undefined)

    constructor(params: {
        cdnState: CdnState
        package: pyYw.Routers.LocalCdn.CdnPackage
    }) {
        Object.assign(this, params)

        this.children = [
            {
                class: 'd-flex justify-content-around w-100',
                children: [
                    {
                        class: 'd-flex flex-column h-100 px-2 w-100',
                        children: [
                            this.packageDetails(this.package),
                            {
                                tag: 'br',
                            },
                        ],
                    },
                ],
            },
        ]
    }

    packageDetails(pack: pyYw.Routers.LocalCdn.CdnPackage): VirtualDOM {
        return {
            class: 'overflow-auto',
            style: {
                maxHeight: '50%',
                width: 'fit-content',
            },
            children: [
                {
                    tag: 'table',
                    class: 'fv-color-primary  w-100 text-center',
                    style: { 'max-height': '100%' },
                    children: [
                        {
                            tag: 'thead',
                            children: [
                                {
                                    tag: 'tr',
                                    class: 'fv-bg-background-alt',
                                    children: [
                                        {
                                            tag: 'td',
                                            innerText: 'Version',
                                            class: 'px-2',
                                        },
                                        {
                                            tag: 'td',
                                            innerText: 'files count',
                                            class: 'px-2',
                                        },
                                        {
                                            tag: 'td',
                                            innerText: 'Entry-point size (kB)',
                                            class: 'px-2',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            tag: 'tbody',
                            children: pack.versions.map(
                                (
                                    packVersion: pyYw.Routers.LocalCdn.CdnVersion,
                                ) => {
                                    return {
                                        tag: 'tr',
                                        class: 'fv-hover-bg-background-alt fv-pointer',
                                        onclick: () => {
                                            this.selectedVersion$.next(
                                                packVersion.version,
                                            )
                                        },
                                        children: [
                                            {
                                                tag: 'td',
                                                innerText: packVersion.version,
                                                class: 'px-2',
                                            },
                                            {
                                                tag: 'td',
                                                innerText:
                                                    packVersion.filesCount,
                                                class: 'px-2',
                                            },
                                            {
                                                tag: 'td',
                                                innerText:
                                                    Math.floor(
                                                        packVersion.entryPointSize,
                                                    ) / 1000,
                                                class: 'px-2',
                                            },
                                        ],
                                    }
                                },
                            ),
                        },
                    ],
                },
            ],
        }
    }
}
