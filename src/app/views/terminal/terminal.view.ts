
import { attr$, child$, childrenAppendOnly$, HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { AppState } from "src/app/app-state"
import { BehaviorSubject, Observable, of, ReplaySubject } from "rxjs"
import { filter, map, take, takeUntil } from "rxjs/operators"
import { PyYouwolClient } from "../../client/py-youwol.client"
import { ContextMessage } from "src/app/client/models"
import { AttributesView, LabelsView, LogView } from "./log.view"



export class NodeHeaderView implements VirtualDOM {

    public readonly class = 'd-flex align-items-center fv-pointer my-2'

    public readonly children: VirtualDOM[]
    public readonly onclick: (ev: MouseEvent) => void

    constructor(
        message: ContextMessage,
        visible$: BehaviorSubject<boolean>,
        expanded$: BehaviorSubject<boolean>,
        status$: Observable<Status>) {

        this.children = [
            {
                class: attr$(
                    visible$,
                    (visible) => visible ? 'fa-caret-down' : 'fa-caret-right',
                    {
                        wrapper: (d) => `fas mr-2 ${d}`
                    }
                ),
            },
            {
                class: attr$(
                    status$,
                    (status) => {
                        return {
                            'processing': 'fas fa-spinner fa-spin',
                            'error': 'fas fa-times fv-text-error',
                            'success': 'fas fa-check fv-text-success',
                        }[status] + ' mr-2'
                    }
                ),
            },
            {
                class: 'mr-3',
                innerText: message.text
            },
            new LabelsView(message.labels),
            new AttributesView(message.attributes)
        ]
        this.onclick = (ev) => {
            ev.stopPropagation()
            if (!expanded$.getValue())
                expanded$.next(true)
            visible$.next(!visible$.getValue())
        }
    }
}


type Status = 'processing' | 'error' | 'success'

export class NodeView implements VirtualDOM {

    public readonly children: VirtualDOM[]

    createdChildren = []
    expanded$: BehaviorSubject<boolean>
    visible$: BehaviorSubject<boolean>

    status$ = new BehaviorSubject<Status>('processing')

    headerMessage: ContextMessage = undefined

    constructor(
        public readonly contextId: string,
        public readonly expanded: boolean,
        messages$: { [key: string]: ReplaySubject<ContextMessage> }
    ) {
        this.expanded$ = new BehaviorSubject<boolean>(expanded)
        this.visible$ = new BehaviorSubject<boolean>(expanded)

        messages$[contextId].pipe(
            filter(message => message.contextId == this.contextId),
            takeUntil(this.status$.pipe(filter(s => s != 'processing')))
        ).subscribe(message => {
            if (message.labels.includes('Label.LOG_ABORT'))
                this.status$.next('error')

            if (message.labels.includes('Label.DONE'))
                this.status$.next('success')
        })

        this.children = [
            {
                class: 'd-flex flex-column overflow-auto',
                children: [
                    child$(
                        messages$[contextId].pipe(
                            filter(m => m.contextId == this.contextId && m.labels.includes("Label.STARTED")),
                            take(1)
                        ),
                        (m) => {
                            this.headerMessage = m
                            return new NodeHeaderView(m, this.visible$, this.expanded$, this.status$)
                        }
                    ),
                    child$(
                        this.expanded$,
                        (expanded) => {
                            if (!expanded)
                                return {}
                            return {
                                class: attr$(
                                    this.visible$,
                                    (visible) => visible ? 'pl-5' : 'd-none'
                                ),
                                style: this.headerMessage && this.headerMessage.labels.includes("Label.BASH")
                                    ? { fontFamily: 'monospace', fontSize: 'x-small' }
                                    : {},
                                children: childrenAppendOnly$(
                                    messages$[contextId].pipe(
                                        filter(m => !m.labels.includes("Label.STARTED")),
                                        map(message => [message])
                                    ),
                                    (message: ContextMessage) => {

                                        if (message.contextId == contextId)
                                            return new LogView(message)

                                        if (message.parentContextId == contextId &&
                                            !this.createdChildren.includes(message.contextId)
                                        ) {
                                            this.createdChildren.push(message.contextId)
                                            return new NodeView(message.contextId, false, messages$)
                                        }
                                        return { class: 'd-none' }
                                    })
                            }
                        })
                ]
            }
        ]
    }
}

export class TerminalView implements VirtualDOM {


    public readonly class = "w-100 h-50 overflow-auto"
    public readonly style = {
        maxHeight: '50vh'
    }
    public readonly children: VirtualDOM[]

    public readonly state: AppState

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    messages$: { [key: string]: ReplaySubject<ContextMessage> } = {
        'root': new ReplaySubject()
    }

    constructor(params: { state: AppState }) {

        PyYouwolClient
            .connectWs()
            .subscribe(message => {
                if (!message.parentContextId)
                    return
                if (this.messages$[message.contextId]) {
                    this.messages$[message.contextId].next(message)
                    this.messages$[message.parentContextId].next(message)
                    return
                }
                this.messages$[message.contextId] = new ReplaySubject()
                this.messages$[message.contextId].next(message)
                this.messages$[message.parentContextId].next(message)
            })
        this.children = [
            new NodeView('root', true, this.messages$)
        ]

    }
}
