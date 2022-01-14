import { VirtualDOM, child$ } from '@youwol/flux-view'
import { BehaviorSubject, Observable } from 'rxjs'
import {
    CdnVersionResponse,
    CdnResponse,
    Project,
} from '../../../client/models'
import { AppState } from '../../../app-state'
import { FilesBrowserView } from '../../files-browser.view'

export class CdnView implements VirtualDOM {
    public readonly tag = 'div'
    public readonly children: Array<VirtualDOM>
    public readonly class = ''
    public readonly state: AppState
    public readonly project: Project

    public readonly cdnPackage$: Observable<CdnResponse>
    public readonly selectedVersion$ = new BehaviorSubject<CdnVersionResponse>(
        undefined,
    )

    constructor(params: { state: AppState; project: Project }) {
        Object.assign(this, params)

        this.cdnPackage$ =
            this.state.projectEvents[this.project.id].cdnResponse$
        this.children = [
            {
                class: 'd-flex h-100 justify-content-around w-100',
                children: [
                    {
                        class: 'd-flex flex-column h-100 px-2 w-100',
                        children: [
                            child$(this.cdnPackage$, (details) =>
                                details ? this.packageDetails(details) : {},
                            ),
                            {
                                tag: 'br',
                            },
                            child$(this.selectedVersion$, (versionDetail) => {
                                return versionDetail
                                    ? new CdnPackageBrowserView(versionDetail)
                                    : {}
                            }),
                        ],
                    },
                ],
            },
        ]
    }

    packageDetails(pack: CdnResponse): VirtualDOM {
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
                                            innerText: 'bundle size (Ko)',
                                            class: 'px-2',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            tag: 'tbody',
                            children: pack.versions.map(
                                (packVersion: CdnVersionResponse) => {
                                    return {
                                        tag: 'tr',
                                        class: 'fv-hover-bg-background-alt fv-pointer',
                                        onclick: () => {
                                            this.selectedVersion$.next(
                                                packVersion,
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
                                                        packVersion.bundleSize /
                                                            100,
                                                    ) / 10,
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

class CdnPackageBrowserView implements VirtualDOM {
    public readonly info: CdnVersionResponse

    public readonly children: VirtualDOM[]

    constructor(info: CdnVersionResponse) {
        this.info = info

        const pattern =
            this.info.namespace == ''
                ? `/libraries/${this.info.name}`
                : `/libraries/${this.info.namespace}/${this.info.name}`

        const index = this.info.path.split(pattern)[0].split('/').length - 2

        this.children = [
            {
                tag: 'h4',
                class: 'fv-text-focus',
                innerText: info.version,
            },
            new FilesBrowserView({
                startingFolder: this.info.path,
                originFolderIndex: index,
            }),
        ]
    }
}
