import { ChildrenLike, AnyVirtualDOM, VirtualDOM } from '@youwol/rx-vdom'
import { CdnState } from '../cdn.state'
import { webpmPackageInfoWidget } from '@youwol/os-widgets'

import { AssetsBackend } from '@youwol/http-clients'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'
import { BehaviorSubject, from } from 'rxjs'
import { AssetLightDescription } from '@youwol/os-core'

/**
 * @category View
 */
export class PackageView implements VirtualDOM<'div'> {
    /**
     * @group States
     */
    public readonly cdnState: CdnState

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex flex-column h-100'
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable Constants
     */
    public readonly packageId: string

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: { cdnState: CdnState; packageId: string }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
                class: 'border-bottom mx-auto mb-2',
                innerText: window.atob(this.packageId),
                style: {
                    fontSize: '25px',
                    width: 'fit-content',
                },
            },
            {
                source$: this.cdnState.packagesEvent[this.packageId].info$,
                vdomMap: (packageInfo: pyYw.Routers.LocalCdn.CdnPackage) => {
                    return new VersionsView({
                        cdnState: this.cdnState,
                        package: packageInfo,
                    })
                },
            },
            {
                source$: new AssetsBackend.AssetsClient()
                    .getAsset$({ assetId: window.btoa(this.packageId) })
                    .pipe(raiseHTTPErrors()),
                vdomMap: (
                    assetResponse: AssetLightDescription,
                ): AnyVirtualDOM => {
                    const asset = {
                        ...assetResponse,
                        rawId: this.packageId,
                    } as AssetLightDescription
                    return {
                        tag: 'div',
                        class: 'flex-grow-1',
                        style: { minHeight: '0px' },
                        children: [
                            {
                                source$: from(
                                    webpmPackageInfoWidget({ asset }),
                                ),
                                vdomMap: (widget: AnyVirtualDOM) => widget,
                            },
                        ],
                    }
                },
            },
        ]
    }
}

/**
 * @category View
 */
export class VersionsView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

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
                tag: 'div',
                class: 'd-flex justify-content-around w-100',
                children: [
                    {
                        tag: 'div',
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

    packageDetails(pack: pyYw.Routers.LocalCdn.CdnPackage): VirtualDOM<'div'> {
        return {
            tag: 'div' as const,
            class: 'overflow-auto',
            style: {
                maxHeight: '50%',
                width: 'fit-content',
            },
            children: [
                {
                    tag: 'table',
                    class: 'fv-color-primary  w-100 text-center',
                    style: { maxHeight: '100%' },
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
                                                innerText: `${packVersion.filesCount}`,
                                                class: 'px-2',
                                            },
                                            {
                                                tag: 'td',
                                                innerText: `${
                                                    Math.floor(
                                                        packVersion.entryPointSize,
                                                    ) / 1000
                                                }`,
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
