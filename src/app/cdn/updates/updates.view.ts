import {
    attr$,
    child$,
    children$,
    childrenAppendOnly$,
    HTMLElement$,
    Stream$,
    VirtualDOM,
} from '@youwol/flux-view'
import { Switch } from '@youwol/fv-button'
import { BehaviorSubject, merge, Observable } from 'rxjs'
import { filter, map, skip, take, tap } from 'rxjs/operators'
import { AppState } from '../../app-state'
import { filterCtxMessage } from '@youwol/http-primitives'
import { TerminalView } from '../../common/terminal'
import { CdnState } from '../cdn.state'
import { DockableTabs } from '@youwol/fv-tabs'
import * as pyYw from '@youwol/local-youwol-client'
/**
 * @category View
 */
export class LogsTab extends DockableTabs.Tab {
    constructor(params: { cdnState: CdnState }) {
        super({
            id: 'logs',
            title: 'Logs',
            icon: 'fas fa-volume-up',
            content: () => {
                return new LogsTabView({
                    cdnState: params.cdnState,
                })
            },
        })
    }
}

/**
 * @category View
 */
export class LogsTabView implements VirtualDOM {
    /**
     * @group State
     */
    public readonly cdnState: CdnState

    /**
     * @group Immutable Constants
     */
    public readonly project: pyYw.Routers.Projects.Project

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'p-2 d-flex flex-column h-100'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '0px',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { cdnState: CdnState }) {
        Object.assign(this, params)
        this.children = [
            new TerminalView(this.cdnState.updatesEvents.messages$),
        ]
    }
}

/**
 * @category View
 */
export class UpdatesView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'd-flex w-100 h-100 flex-column'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group States
     */
    public readonly appState: AppState

    /**
     * @group States
     */
    public readonly cdnState: CdnState

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        position: 'relative',
    }
    constructor(params: { cdnState: CdnState }) {
        Object.assign(this, params)
        this.appState = this.cdnState.appState

        const bottomNavState = new DockableTabs.State({
            disposition: 'bottom',
            persistTabsView: true,
            viewState$: new BehaviorSubject<DockableTabs.DisplayMode>(
                'collapsed',
            ),
            tabs$: new BehaviorSubject([
                new LogsTab({
                    cdnState: this.cdnState,
                }),
            ]),
            selected$: new BehaviorSubject<string>('logs'),
        })
        const bottomNav = new DockableTabs.View({
            state: bottomNavState,
            styleOptions: { initialPanelSize: '500px' },
        })

        this.cdnState.cdnClient.triggerCollectUpdates$().subscribe()

        this.children = [
            {
                class: 'w-100 d-flex justify-content-center flex-column flex-grow-1 overflow-auto',
                children: children$(this.appState.environment$, () => {
                    this.cdnState.collectUpdates()
                    return [
                        new SpinnerView({ cdnState: this.cdnState }),
                        new DownloadBtnView({ cdnState: this.cdnState }),
                        {
                            class: 'flex-grow-1 mx-auto overflow-auto',
                            children: [
                                new TableView({ cdnState: this.cdnState }),
                            ],
                        },
                    ]
                }),
            },
            bottomNav,
        ]
    }
}

/**
 * @category View
 */
export class TableView implements VirtualDOM {
    /**
     * @group Immutable Constants
     */
    public readonly orders: Record<pyYw.Routers.LocalCdn.UpdateStatus, number> =
        {
            remoteAhead: 0,
            localAhead: 1,
            mismatch: 2,
            upToDate: 3,
        }

    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'table'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group States
     */
    public readonly cdnState: CdnState

    /**
     * @group Immutable DOM Constants
     */
    public readonly connectedCallback: (
        elem: HTMLElement$ & HTMLDivElement,
    ) => void

    constructor(params: { cdnState: CdnState }) {
        Object.assign(this, params)

        const sub = this.cdnState.updatesEvents.updateChecksResponse$
            .pipe(
                filter((d) => {
                    return d.data.status == 'remoteAhead'
                }),
            )
            .subscribe((d) => {
                this.cdnState.insertInDownloadQueue(
                    d.data.packageName,
                    d.data.remoteVersionInfo.version,
                )
            })

        this.children = [
            {
                tag: 'thead',
                children: [this.headerRowView()],
            },
            {
                tag: 'tbody',
                children: childrenAppendOnly$(
                    this.cdnState.updatesEvents.updateChecksResponse$.pipe(
                        map((d) => [d.data]),
                    ),
                    (d: pyYw.Routers.LocalCdn.CheckUpdateResponse) =>
                        new RowView({
                            cdnState: this.cdnState,
                            firstResponse: d,
                        }),
                    {
                        orderingIndex: (
                            data: pyYw.Routers.LocalCdn.CheckUpdateResponse,
                        ) => this.orders[data.status],
                    },
                ),
            },
        ]
        this.connectedCallback = (elem: HTMLElement$) =>
            elem.ownSubscriptions(sub)
    }

    headerRowView() {
        return {
            tag: 'tr',
            style: {
                fontWeight: 'bolder',
            },
            children: [
                new SimpleCellView('Name'),
                new SimpleCellView('Local version'),
                new SimpleCellView('Remote version'),
                new SimpleCellView('Status'),
                new SimpleCellView(''),
            ],
        }
    }
}

type StatusType = pyYw.Routers.LocalCdn.UpdateStatus | 'pending' | 'error'

/**
 * @category View
 */
export class RowView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'tr'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    public readonly connectedCallback: (
        elem: HTMLElement$ & HTMLDivElement,
    ) => void

    public readonly firstResponse: pyYw.Routers.LocalCdn.CheckUpdateResponse
    public readonly cdnState: CdnState
    public readonly name: string
    public readonly remoteVersion: string
    public readonly rowInfo$: BehaviorSubject<{
        status: StatusType
        localVersion: string
        toggleVisible: boolean
    }>

    constructor(params: {
        cdnState: CdnState
        firstResponse: pyYw.Routers.LocalCdn.CheckUpdateResponse
    }) {
        Object.assign(this, params)

        this.rowInfo$ = new BehaviorSubject({
            status: this.firstResponse.status,
            localVersion: this.firstResponse.localVersionInfo.version,
            toggleVisible:
                this.firstResponse.status == 'remoteAhead' ||
                this.firstResponse.status == 'mismatch',
        })
        this.name = this.firstResponse.packageName
        this.remoteVersion = this.firstResponse.remoteVersionInfo.version

        const subs = [
            this.withPackageDownloading(),
            this.withPackageDownloaded(),
            this.withError(),
        ]
        this.connectedCallback = (elem: HTMLElement$) => {
            elem.ownSubscriptions(...subs)
        }
        this.children = [
            new SimpleCellView(this.name),
            new SimpleCellView(
                this.rowInfo$.pipe(map((info) => info.localVersion)),
            ),
            new SimpleCellView(this.remoteVersion),
            new StatusCellView(this.rowInfo$.pipe(map((info) => info.status))),
            child$(
                this.rowInfo$.pipe(map((info) => info.toggleVisible)),
                (visible) => {
                    return visible
                        ? this.toggleView({
                              name: this.name,
                              version: this.remoteVersion,
                          })
                        : {}
                },
            ),
        ]
    }

    withPackageDownloading() {
        return this.cdnState.updatesEvents.messages$
            .pipe(
                filterCtxMessage({
                    withLabels: ['Label.PACKAGE_DOWNLOADING', 'Label.STARTED'],
                    withAttributes: {
                        packageName: this.name,
                        packageVersion: this.remoteVersion,
                    },
                }),
                tap(() => {
                    this.cdnState.removeFromDownloadQueue(
                        this.name,
                        this.remoteVersion,
                    )
                }),
            )
            .subscribe(() => {
                this.rowInfo$.next({
                    status: 'pending',
                    localVersion: '',
                    toggleVisible: false,
                })
            })
    }

    withPackageDownloaded() {
        return this.cdnState.updatesEvents.messages$
            .pipe(
                filterCtxMessage({
                    withLabels: ['DownloadedPackageResponse'],
                    withAttributes: {
                        packageName: this.name,
                        packageVersion: this.remoteVersion,
                    },
                }),
            )
            .subscribe(({ data }) => {
                this.rowInfo$.next({
                    status: 'upToDate',
                    localVersion: data['version'],
                    toggleVisible: false,
                })
            })
    }

    withError() {
        return this.cdnState.updatesEvents.messages$
            .pipe(
                filterCtxMessage({
                    withLabels: [
                        'Label.PACKAGE_DOWNLOADING',
                        'Label.EXCEPTION',
                    ],
                    withAttributes: {
                        packageName: this.name,
                        packageVersion: this.remoteVersion,
                    },
                }),
            )
            .subscribe(() => {
                this.rowInfo$.next({
                    status: 'error',
                    localVersion: this.firstResponse.localVersionInfo.version,
                    toggleVisible: true,
                })
            })
    }

    toggleView({ name, version }: { name: string; version: string }) {
        const included = this.cdnState.downloadQueue$
            .getValue()
            .find((d) => d.packageName == name && d.version == version)

        const view = new Switch.View({
            state: new Switch.State(included != undefined),
        })

        return {
            tag: 'td',
            class: 'p-2',
            children: [view],
            connectedCallback: (elem: HTMLElement$) => {
                elem.ownSubscriptions(
                    // skip(1) to only get the 'onclick' event, brittle
                    view.state.value$.pipe(skip(1)).subscribe(() => {
                        this.cdnState.toggleInDownloadQueue(name, version)
                    }),
                )
            },
        }
    }
}

/**
 * @category View
 */
export class SimpleCellView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'td'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'px-2'

    /**
     * @group Immutable DOM Constants
     */
    public readonly innerText: string | Stream$<string, string>

    constructor(text: string | Observable<string>) {
        this.innerText =
            typeof text == 'string' ? text : attr$(text, (content) => content)
    }
}

/**
 * @category View
 */
export class StatusCellView implements VirtualDOM {
    /**
     * @group Immutable Constants
     */
    public readonly statusName: Record<StatusType, string> = {
        remoteAhead: 'local version outdated',
        localAhead: 'local version ahead',
        mismatch: 'mismatch',
        upToDate: '',
        pending: 'pending',
        error: 'an error occurred',
    }

    /**
     * @group Immutable Constants
     */
    public readonly statusIcon: Record<StatusType, string> = {
        remoteAhead: 'fas fa-exclamation-triangle fv-text-focus',
        localAhead: 'fas fa-exclamation-triangle fv-text-focus',
        mismatch: 'fas fa-exclamation-triangle fv-text-focus',
        upToDate: 'fas fa-check fv-text-success',
        pending: 'fas fa-spinner fa-spin',
        error: 'fas fa-times fv-text-error',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'td'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'px-2'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(status$: Observable<StatusType>) {
        this.children = [
            {
                class: attr$(status$, (status) => this.statusIcon[status]),
            },
            {
                innerText: attr$(status$, (status) => this.statusName[status]),
            },
        ]
    }
}

/**
 * @category View
 */
class SpinnerView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 d-flex justify-content-center'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group States
     */
    public readonly cdnState: CdnState

    constructor(params: { cdnState: CdnState }) {
        Object.assign(this, params)

        this.children = [
            child$(
                merge(
                    this.cdnState.updatesEvents.messages$.pipe(take(1)),
                    this.cdnState.updatesEvents.updatesChecksResponse$,
                ),
                (d: pyYw.ContextMessage) => {
                    return d.labels.includes('CheckUpdatesResponse')
                        ? {}
                        : {
                              classes: 'fas fa-spinner fa-spin',
                          }
                },
            ),
        ]
    }
}

/**
 * @category View
 */
export class DownloadBtnView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 d-flex justify-content-center my-2'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    /**
     * @group States
     */
    public cdnState: CdnState

    constructor(params: { cdnState: CdnState }) {
        Object.assign(this, params)

        this.children = [
            child$(this.cdnState.updatesEvents.updatesChecksResponse$, () => {
                return {
                    class: 'fv-bg-secondary border rounded fv-hover-xx-lighter fv-pointer p-2',
                    innerText: attr$(
                        this.cdnState.downloadQueue$,
                        (values) => `Download (${values.length})`,
                    ),
                    onclick: () => this.cdnState.proceedDownloads(),
                }
            }),
        ]
    }
}
