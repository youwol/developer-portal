import {
    attr$,
    children$,
    VirtualDOM,
} from '@youwol/flux-view'
import { PyYouwolClient } from '../../client/py-youwol.client'


import { AppState } from '../../app-state'
import { map } from 'rxjs/operators'
import { ImmutableTree } from '@youwol/fv-tree'
import { AttributesView, LogView, MethodLabelView } from '../terminal/log.view'
import { ContextMessage, LogResponse, LogsResponse } from 'src/app/client/models'
import { TerminalState } from '../terminal/terminal.view'
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs'
import { classesButton } from '../utils-view'


function uid() {
    return `${Math.floor(Math.random() * 1e6)}`
}

export class LogLeaf extends ImmutableTree.Node {

    constructor(params: {
        text: string,
        level: string,
        attributes: { [key: string]: string },
        labels: string[],
        data: any,
        contextId: string,
        parentContextId: string
    }) {
        super({
            id: uid()
        })
        Object.assign(this, params)
    }
}

export class LogNode extends ImmutableTree.Node {

    constructor(params: {
        text: string,
        level: string,
        attributes: { [key: string]: string },
        labels: string[],
        data: any,
        contextId: string,
        parentContextId: string
    }) {
        super({
            id: uid(),
            children: PyYouwolClient.system.logs$(params.contextId).pipe(
                map(({ logs }) => logs.map(log => {
                    if (log.labels.includes("Label.STARTED"))
                        return new LogNode(log)
                    return new LogLeaf(log)
                }))
            )
        })
        Object.assign(this, params)
    }
}

export class AdminView implements VirtualDOM {

    static ClassSelector = 'admin-view'
    public readonly class = `${AdminView.ClassSelector} w-100 h-100 d-flex flex-column p-2`
    public readonly children: VirtualDOM[]
    public readonly state: AppState

    public readonly logs$ = new ReplaySubject<LogsResponse>(1)
    public readonly fetchingLogs$ = new BehaviorSubject<boolean>(false)


    constructor(params: { state: AppState }) {

        Object.assign(this, params)

        this.children = [
            {
                class: `${classesButton} mx-auto px-4`,
                children: [
                    {
                        class: attr$(
                            this.fetchingLogs$,
                            (isFetching) => isFetching ? 'fa-spinner fa-spin' : 'fa-sync',
                            {
                                wrapper: (d) => `${d} fas`
                            }
                        )
                    }
                ],
                style: {
                    width: 'fit-content'
                },
                onclick: () => this.refresh()
            },
            new LogsView({ state: this.state, logs$: this.logs$ })
        ]
        this.refresh()
    }

    refresh() {
        this.fetchingLogs$.next(true)
        PyYouwolClient.system.queryLogs$({ fromTimestamp: Date.now(), maxCount: 1000 })
            .subscribe((logs) => {
                this.logs$.next(logs)
                this.fetchingLogs$.next(false)
            })
    }
}


function createNodeTreeView(log: LogResponse, terminalState: TerminalState) {

    let treeState = new ImmutableTree.State({
        rootNode: new LogNode(log)
    })
    let treeView = new ImmutableTree.View({
        state: treeState,
        headerView: (_, node) => {
            return (node instanceof LogNode)
                ? new NodeView(node as any)
                : new LogView({
                    state: terminalState,
                    message: node as any
                })
        },
        options: { stepPadding: 30 }
    })

    return {
        children: [
            treeView
        ]
    }
}


export class LogsView implements VirtualDOM {

    static ClassSelector = 'logs-view'

    public readonly class = `${LogsView.ClassSelector} flex-grow-1 w-100`
    public readonly style = {
        minHeight: "0px"
    }
    public readonly children: VirtualDOM[]
    public readonly state: AppState
    public readonly terminalState = new TerminalState()
    public readonly logs$: Observable<LogsResponse>

    constructor(params: { state: AppState, logs$: Observable<LogsResponse> }) {

        Object.assign(this, params)
        this.children = [
            {
                class: 'w-100 h-100 overflow-auto',
                children: children$(
                    this.logs$,
                    (response: LogsResponse) => {
                        return response.logs.map((log) => {
                            return createNodeTreeView(log, this.terminalState)
                        })
                    }
                )
            }
        ]
    }
}


export class NodeView implements VirtualDOM {

    static ClassSelector = "node-view"

    public readonly class = `${NodeView.ClassSelector} d-flex align-items-center fv-pointer my-2`

    public readonly children: VirtualDOM[]

    constructor(
        message: ContextMessage,
    ) {
        this.children = [
            {
                class: message['failed'] ? 'fas fa-times fv-text-error mr-2' : 'fas fa-check fv-text-success mr-2'
            },
            new MethodLabelView(message),
            new AttributesView(message.attributes),
        ]
    }
}
