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
import { filter, map, mergeMap, skip, take, tap } from 'rxjs/operators'
import { AppState, filterCtxMessage, Topic } from '../../app-state'
import {
    CheckUpdateResponse,
    ContextMessage,
    UpdateStatus,
} from '../../client/models'
import { TerminalView } from '../terminal/terminal.view'

export class UpdatesView implements VirtualDOM {
    public readonly class: Stream$<Topic, string>
    public readonly children: VirtualDOM[]
    public readonly state: AppState

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        this.class = attr$(
            this.state.selectedTopic$,
            (topic: Topic) => (topic == 'Updates' ? ' d-flex' : 'd-none'),
            {
                wrapper: (d) => `${d} w-100 h-100 flex-column p-2`,
            },
        )
        this.children = [
            {
                class: 'w-100 d-flex justify-content-center flex-column h-50',
                children: children$(
                    params.state.selectedTopic$.pipe(
                        filter((topic) => topic === 'Updates'),
                        mergeMap(() => {
                            return params.state.environment$
                        })
                    ),
                    () => {
                        this.state.collectUpdates()
                        return [
                            new SpinnerView({ state: this.state }),
                            new DownloadBtnView({ state: this.state }),
                            {
                                class: 'flex-grow-1 mx-auto overflow-auto',
                                children: [
                                    new TableView({ state: this.state }),
                                ],
                            },
                        ]
                    },
                ),
            },
            new TerminalView(this.state.updatesEvents.messages$),
        ]
    }
}

class TableView implements VirtualDOM {
    public readonly orders: Record<UpdateStatus, number> = {
        remoteAhead: 0,
        localAhead: 1,
        mismatch: 2,
        upToDate: 3,
    }

    public readonly tag = 'table'

    public readonly children: VirtualDOM[]

    public readonly state: AppState

    public readonly connectedCallback: (
        elem: HTMLElement$ & HTMLDivElement,
    ) => void

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        const sub = this.state.updatesEvents.updateChecksResponse$
            .pipe(
                filter((d) => {
                    return d.data.status == 'remoteAhead'
                }),
            )
            .subscribe((d) => {
                this.state.insertInDownloadQueue(
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
                    this.state.updatesEvents.updateChecksResponse$.pipe(
                        map((d) => [d.data]),
                    ),
                    (d: CheckUpdateResponse) =>
                        new RowView({ state: this.state, firstResponse: d }),
                    {
                        orderingIndex: (data: CheckUpdateResponse) =>
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

type StatusType = UpdateStatus | 'pending' | 'error'

class RowView implements VirtualDOM {
    public readonly tag = 'tr'

    public readonly children: VirtualDOM[]

    public readonly connectedCallback: (
        elem: HTMLElement$ & HTMLDivElement,
    ) => void

    public readonly firstResponse: CheckUpdateResponse
    public readonly state: AppState
    public readonly name: string
    public readonly remoteVersion: string
    public readonly rowInfo$: BehaviorSubject<{
        status: StatusType
        localVersion: string
        toggleVisible: boolean
    }>

    constructor(params: {
        state: AppState
        firstResponse: CheckUpdateResponse
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
        return this.state.updatesEvents.messages$
            .pipe(
                filterCtxMessage({
                    withLabels: ['Label.PACKAGE_DOWNLOADING', 'Label.STARTED'],
                    withAttributes: {
                        packageName: this.name,
                        packageVersion: this.remoteVersion,
                    },
                }),
                tap(() => {
                    this.state.removeFromDownloadQueue(
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
        return this.state.updatesEvents.messages$
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
        return this.state.updatesEvents.messages$
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
        const included = this.state.downloadQueue$
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
                        this.state.toggleInDownloadQueue(name, version)
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
    public readonly statusName: Record<
        StatusType,
        string
    > = {
            remoteAhead: 'local version outdated',
            localAhead: 'local version ahead',
            mismatch: 'mismatch',
            upToDate: '',
            pending: 'pending',
            error: 'an error occurred',
        }
    public readonly statusIcon: Record<
        StatusType,
        string
    > = {
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
    public state: AppState

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        this.children = [
            child$(
                merge(
                    this.state.updatesEvents.messages$.pipe(take(1)),
                    this.state.updatesEvents.updatesChecksResponse$,
                ),
                (d: ContextMessage) => {
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
    public readonly class = 'w-100 d-flex justify-content-center'
    public readonly children: VirtualDOM[]
    public state: AppState

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        this.children = [
            child$(this.state.updatesEvents.updatesChecksResponse$, () => {
                return {
                    class: 'fv-bg-secondary border rounded fv-hover-xx-lighter fv-pointer p-2',
                    innerText: attr$(
                        this.state.downloadQueue$,
                        (values) => `Download (${values.length})`,
                    ),
                    onclick: () => this.state.proceedDownloads(),
                }
            }),
        ]
    }
}
