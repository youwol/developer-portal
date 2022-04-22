import { child$, VirtualDOM } from '@youwol/flux-view'
import { CdnState } from '../cdn.state'

import {
    PyYouwol as pyYw,
    AssetsBackend,
    raiseHTTPErrors,
} from '@youwol/http-clients'
import { BehaviorSubject } from 'rxjs'
import { Assets } from '@youwol/platform-essentials'

export class PackageView implements VirtualDOM {
    public readonly cdnState: CdnState
    public readonly class = 'd-flex flex-column h-100'
    public readonly package: pyYw.CdnPackage
    public readonly children: VirtualDOM[]
    constructor(params: { cdnState: CdnState; package: pyYw.CdnPackage }) {
        Object.assign(this, params)
        this.children = [
            {
                class: 'border-bottom mx-auto mb-2',
                innerText: this.package.name,
                style: {
                    fontSize: '25px',
                    width: 'fit-content',
                },
            },
            new VersionsView({
                cdnState: this.cdnState,
                package: this.package,
            }),
            child$(
                new AssetsBackend.AssetsClient()
                    .getAsset$({ assetId: btoa(this.package.id) })
                    .pipe(raiseHTTPErrors()),
                (asset) => {
                    return {
                        class: 'flex-grow-1',
                        style: { minHeight: '0px' },
                        children: [
                            new Assets.PackageInfoView({
                                asset: {
                                    ...asset,
                                    rawId: this.package.id,
                                } as any,
                            }),
                        ],
                    }
                },
            ),
        ]
    }
}

export class VersionsView implements VirtualDOM {
    public readonly tag = 'div'
    public readonly children: Array<VirtualDOM>
    public readonly class = 'overflow-auto mx-auto'
    public readonly style = {
        maxHeight: '50%',
    }
    public readonly cdnState: CdnState
    public readonly package: pyYw.CdnPackage

    public readonly selectedVersion$ = new BehaviorSubject<string>(undefined)

    constructor(params: { cdnState: CdnState; package: pyYw.CdnPackage }) {
        Object.assign(this, params)

        const packageInfo$ =
            this.cdnState.packagesEvent[this.package.name].info$
        this.children = [
            {
                class: 'd-flex justify-content-around w-100',
                children: [
                    {
                        class: 'd-flex flex-column h-100 px-2 w-100',
                        children: [
                            child$(packageInfo$, (info) =>
                                info ? this.packageDetails(info) : {},
                            ),
                            {
                                tag: 'br',
                            },
                        ],
                    },
                ],
            },
        ]
    }

    packageDetails(pack: pyYw.CdnPackage): VirtualDOM {
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
                                (packVersion: pyYw.CdnVersion) => {
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
