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
import { ywSpinnerView } from '@youwol/platform-essentials'
import { BehaviorSubject, merge, Observable } from 'rxjs'
import { filter, map, skip, take, tap } from 'rxjs/operators'
import { AppState } from '../../app-state'
import { PyYouwol as pyYw, filterCtxMessage } from '@youwol/http-clients'
import { TerminalView } from '../../common/terminal/terminal.view'
import { CdnState } from '../cdn.state'
import { DockableTabs } from '@youwol/fv-tabs'

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

export class LogsTabView implements VirtualDOM {
    public readonly cdnState: CdnState
    public readonly project: pyYw.Project
    public readonly class = 'p-2 d-flex flex-column h-100'
    public readonly style = {
        minHeight: '0px',
    }
    public readonly children: VirtualDOM[]

    constructor(params: { cdnState: CdnState }) {
        Object.assign(this, params)
        this.children = [
            new TerminalView(this.cdnState.updatesEvents.messages$),
        ]
    }
}

export class UpdatesView implements VirtualDOM {
    public readonly class = 'd-flex w-100 h-100 flex-column'
    public readonly children: VirtualDOM[]
    public readonly appState: AppState
    public readonly cdnState: CdnState
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
        let bottomNav = new DockableTabs.View({
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

class TableView implements VirtualDOM {
    public readonly orders: Record<pyYw.UpdateStatus, number> = {
        remoteAhead: 0,
        localAhead: 1,
        mismatch: 2,
        upToDate: 3,
    }

    public readonly tag = 'table'

    public readonly children: VirtualDOM[]

    public readonly cdnState: CdnState

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
                    (d: pyYw.CheckUpdateResponse) =>
                        new RowView({
                            cdnState: this.cdnState,
                            firstResponse: d,
                        }),
                    {
                        orderingIndex: (data: pyYw.CheckUpdateResponse) =>
                            this.orders[data.status],
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

type StatusType = pyYw.UpdateStatus | 'pending' | 'error'

class RowView implements VirtualDOM {
    public readonly tag = 'tr'

    public readonly children: VirtualDOM[]

    public readonly connectedCallback: (
        elem: HTMLElement$ & HTMLDivElement,
    ) => void

    public readonly firstResponse: pyYw.CheckUpdateResponse
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
        firstResponse: pyYw.CheckUpdateResponse
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

class SimpleCellView implements VirtualDOM {
    public readonly tag = 'td'
    public readonly class = 'px-2'
    public readonly innerText: string | Stream$<string, string>

    constructor(text: string | Observable<string>) {
        this.innerText =
            typeof text == 'string' ? text : attr$(text, (content) => content)
    }
}

class StatusCellView implements VirtualDOM {
    public readonly statusName: Record<StatusType, string> = {
        remoteAhead: 'local version outdated',
        localAhead: 'local version ahead',
        mismatch: 'mismatch',
        upToDate: '',
        pending: 'pending',
        error: 'an error occurred',
    }
    public readonly statusIcon: Record<StatusType, string> = {
        remoteAhead: 'fas fa-exclamation-triangle fv-text-focus',
        localAhead: 'fas fa-exclamation-triangle fv-text-focus',
        mismatch: 'fas fa-exclamation-triangle fv-text-focus',
        upToDate: 'fas fa-check fv-text-success',
        pending: 'fas fa-spinner fa-spin',
        error: 'fas fa-times fv-text-error',
    }

    public readonly tag = 'td'
    public readonly class = 'px-2'
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

class SpinnerView implements VirtualDOM {
    public readonly class = 'w-100 d-flex justify-content-center'
    public readonly children: VirtualDOM[]
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
                        : ywSpinnerView({
                              classes: '',
                              size: '25px',
                              duration: 1.5,
                          })
                },
            ),
        ]
    }
}

class DownloadBtnView implements VirtualDOM {
    public readonly class = 'w-100 d-flex justify-content-center my-2'
    public readonly children: VirtualDOM[]
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
