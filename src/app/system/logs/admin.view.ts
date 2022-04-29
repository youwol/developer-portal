import { attr$, children$, VirtualDOM } from '@youwol/flux-view'
import { map } from 'rxjs/operators'
import { ImmutableTree } from '@youwol/fv-tree'
import {
    AttributesView,
    LogView,
    MethodLabelView,
} from '../../common/terminal/log.view'
import { PyYouwol as pyYw, raiseHTTPErrors } from '@youwol/http-clients'
import { TerminalState } from '../../common/terminal/terminal.view'
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs'
import { classesButton } from '../../common/utils-view'
import { SystemState } from '../system.state'

function getChildren(contextId: string) {
    return new pyYw.PyYouwolClient().admin.system.queryLogs$(contextId).pipe(
        raiseHTTPErrors(),
        map(({ logs }) =>
            logs.map((log) => {
                if (log.labels.includes('Label.STARTED')) {
                    return new LogNode(log, getChildren(log.contextId))
                }
                return new LogNode(log)
            }),
        ),
    )
}

export class LogNode extends ImmutableTree.Node {
    text: string
    level: string
    attributes: { [key: string]: string }
    labels: pyYw.Label[]
    data: unknown
    contextId: string
    parentContextId: string

    constructor(
        params: {
            text: string
            level: string
            attributes: { [key: string]: string }
            labels: string[]
            data: unknown
            contextId: string
            parentContextId: string
        },
        children?: Observable<ImmutableTree.Node[]>,
    ) {
        super({
            id: `${Math.floor(Math.random() * 1e6)}`,
            children,
        })
        Object.assign(this, params)
    }
}

export class AdminLogsView implements VirtualDOM {
    static ClassSelector = 'admin-view'
    public readonly class = `${AdminLogsView.ClassSelector} w-100 h-100 d-flex flex-column p-2`
    public readonly children: VirtualDOM[]
    public readonly systemState: SystemState

    public readonly logs$ = new ReplaySubject<pyYw.LogsResponse>(1)
    public readonly fetchingLogs$ = new BehaviorSubject<boolean>(false)

    constructor(params: { systemState: SystemState }) {
        Object.assign(this, params)

        this.children = [
            {
                class: 'd-flex align-items-center',
                children: [
                    {
                        class: `${classesButton} mx-auto px-4`,
                        children: [
                            {
                                class: attr$(this.fetchingLogs$, (isFetching) =>
                                    isFetching
                                        ? 'fas fa-spinner fa-spin'
                                        : 'fas fa-sync',
                                ),
                            },
                        ],
                        style: {
                            width: 'fit-content',
                        },
                        onclick: () => this.refresh(),
                    },
                    {
                        class: `${classesButton} mx-auto px-4`,
                        innerText: 'clear',
                        onclick: () => this.clear(),
                    },
                ],
            },
            new LogsView({
                systemState: this.systemState,
                logs$: this.logs$,
            }),
        ]
        this.refresh()
    }

    refresh() {
        this.fetchingLogs$.next(true)
        new pyYw.PyYouwolClient().admin.system
            .queryRootLogs$({ fromTimestamp: Date.now(), maxCount: 1000 })
            .pipe(raiseHTTPErrors())
            .subscribe((logs) => {
                this.logs$.next(logs as any)
                this.fetchingLogs$.next(false)
            })
    }
    clear() {
        this.fetchingLogs$.next(true)
        new pyYw.PyYouwolClient().admin.system.clearLogs$().subscribe(() => {
            this.refresh()
        })
    }
}

export class TreeView implements VirtualDOM {
    static ClassSelector = 'tree-view'
    public readonly class = `${TreeView.ClassSelector}`
    public readonly log: pyYw.LogResponse
    public readonly terminalState: TerminalState
    public readonly children: VirtualDOM[]

    constructor(params: {
        log: pyYw.LogResponse
        terminalState: TerminalState
    }) {
        Object.assign(this, params)
        const treeState = new ImmutableTree.State({
            rootNode: new LogNode(this.log, getChildren(this.log.contextId)),
        })
        const treeView = new ImmutableTree.View({
            state: treeState,
            headerView: (_, node) => {
                return node.children
                    ? new NodeView(node)
                    : new LogView({
                          state: this.terminalState,
                          message: node,
                      })
            },
            options: { stepPadding: 30 },
        })
        this.children = [treeView]
    }
}

export class LogsView implements VirtualDOM {
    static ClassSelector = 'logs-view'

    public readonly class = `${LogsView.ClassSelector} flex-grow-1 w-100`
    public readonly style = {
        minHeight: '0px',
    }
    public readonly children: VirtualDOM[]
    public readonly terminalState = new TerminalState()
    public readonly logs$: Observable<pyYw.LogsResponse>

    constructor(params: {
        systemState: SystemState
        logs$: Observable<pyYw.LogsResponse>
    }) {
        Object.assign(this, params)
        this.children = [
            {
                class: 'w-100 h-100 overflow-auto',
                children: children$(this.logs$, (response: pyYw.LogsResponse) =>
                    response.logs.map(
                        (log) =>
                            new TreeView({
                                log,
                                terminalState: this.terminalState,
                            }),
                    ),
                ),
            },
        ]
    }
}

export class NodeView implements VirtualDOM {
    static ClassSelector = 'node-view'

    public readonly class = `${NodeView.ClassSelector} d-flex align-items-center fv-pointer my-2`

    public readonly children: VirtualDOM[]

    constructor(message: pyYw.ContextMessage) {
        this.children = [
            {
                class: message['failed']
                    ? 'fas fa-times fv-text-error mr-2'
                    : 'fas fa-check fv-text-success mr-2',
            },
            new MethodLabelView(message),
            new AttributesView(message.attributes),
        ]
    }
}
