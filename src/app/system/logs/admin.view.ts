import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { map } from 'rxjs/operators'
import { ImmutableTree } from '@youwol/rx-tree-views'
import {
    AttributesView,
    LogView,
    MethodLabelView,
    TerminalState,
} from '../../common/terminal'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs'
import { classesButton } from '../../common'
import { SystemState } from '../system.state'

function getChildren(contextId: string) {
    return new pyYw.PyYouwolClient().admin.system
        .queryLogs$({ parentId: contextId })
        .pipe(
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

/**
 * @category Data-structure
 */
export class LogNode extends ImmutableTree.Node {
    /**
     * @group Immutable Constants
     */
    public readonly text: string

    /**
     * @group Immutable Constants
     */
    public readonly level: string

    /**
     * @group Immutable Constants
     */
    public readonly attributes: { [key: string]: string }

    /**
     * @group Immutable Constants
     */
    public readonly labels: pyYw.Label[]

    /**
     * @group Immutable Constants
     */
    public readonly data: unknown

    /**
     * @group Immutable Constants
     */
    public readonly contextId: string

    /**
     * @group Immutable Constants
     */
    public readonly parentContextId: string

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

/**
 * @category View
 */
export class AdminLogsView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable Constants
     */
    static ClassSelector = 'admin-view'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = `${AdminLogsView.ClassSelector} w-100 h-100 d-flex flex-column p-2`

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group States
     */
    public readonly systemState: SystemState

    /**
     * @group Observables
     */
    public readonly logs$ = new ReplaySubject<pyYw.Routers.System.LogsResponse>(
        1,
    )

    /**
     * @group Observables
     */
    public readonly fetchingLogs$ = new BehaviorSubject<boolean>(false)

    constructor(params: { systemState: SystemState }) {
        Object.assign(this, params)

        this.children = [
            {
                tag: 'div',
                class: 'd-flex align-items-center',
                children: [
                    {
                        tag: 'div',
                        class: `${classesButton} mx-auto px-4`,
                        children: [
                            {
                                tag: 'div',
                                class: {
                                    source$: this.fetchingLogs$,
                                    vdomMap: (isFetching) =>
                                        isFetching
                                            ? 'fas fa-spinner fa-spin'
                                            : 'fas fa-sync',
                                },
                            },
                        ],
                        style: {
                            width: 'fit-content',
                        },
                        onclick: () => this.refresh(),
                    },
                    {
                        tag: 'div',
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
                this.logs$.next(logs)
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

/**
 * @category View
 */
export class TreeView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable Constants
     */
    static ClassSelector = 'tree-view'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = `${TreeView.ClassSelector}`

    /**
     * @group Immutable Constants
     */
    public readonly log: pyYw.Routers.System.LogResponse

    /**
     * @group States
     */
    public readonly terminalState: TerminalState

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: {
        log: pyYw.Routers.System.LogResponse
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

/**
 * @category View
 */
export class LogsView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable Constants
     */
    static ClassSelector = 'logs-view'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = `${LogsView.ClassSelector} flex-grow-1 w-100`

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        minHeight: '0px',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    /**
     * @group States
     */
    public readonly terminalState = new TerminalState()

    /**
     * @group Observables
     */
    public readonly logs$: Observable<pyYw.Routers.System.LogsResponse>

    constructor(params: {
        systemState: SystemState
        logs$: Observable<pyYw.Routers.System.LogsResponse>
    }) {
        Object.assign(this, params)
        this.children = [
            {
                tag: 'div',
                class: 'w-100 h-100 overflow-auto',
                children: {
                    policy: 'replace',
                    source$: this.logs$,
                    vdomMap: (response: pyYw.Routers.System.LogsResponse) =>
                        response.logs.map(
                            (log) =>
                                new TreeView({
                                    log,
                                    terminalState: this.terminalState,
                                }),
                        ),
                },
            },
        ]
    }
}

/**
 * @category View
 */
export class NodeView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable Constants
     */
    static ClassSelector = 'node-view'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = `${NodeView.ClassSelector} d-flex align-items-center fv-pointer my-2`

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(message: pyYw.ContextMessage) {
        this.children = [
            {
                tag: 'div',
                class: message['failed']
                    ? 'fas fa-times fv-text-error mr-2'
                    : 'fas fa-check fv-text-success mr-2',
            },
            new MethodLabelView(message),
            new AttributesView(message.attributes),
        ]
    }
}
