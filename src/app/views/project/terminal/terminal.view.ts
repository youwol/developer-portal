
import { attr$, child$, childrenAppendOnly$, HTMLElement$, VirtualDOM } from "@youwol/flux-view"
import { BehaviorSubject, Observable, of, ReplaySubject } from "rxjs"
import { delay, filter, map, take, takeUntil } from "rxjs/operators"
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
        public readonly nestedIndex: number,
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
                                    (visible) => visible ? 'py-2' : 'd-none'
                                ),
                                style: { paddingLeft: `${this.nestedIndex > 0 ? 40 : 0}px` },
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
                                            return new NodeView(message.contextId, nestedIndex + 1, false, messages$)
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


let invite = `
                    *@@@@@@,         
                    *@@@@@@,                
          /@@@@@@%  *@@@@@@,  %@@@@@@(      
        ,&@@@@@@@@@@@@@@@@@@@@@@@@@@@@&*    
             %@@@@@@@@@@@@@@@@@@@@%         
    (            /@@@@@@@@@@@@/            /
    @@@@#.           ,&@@&*           .#@@@@
    @@@@@@@@@.                    .@@@@@@@@@
    #@@@@@@@@@@@@(            (@@@@@@@@@@@@#
        /@@@@@@@@@@@#      #@@@@@@@@@@@(    
        *@@@@@@@@@@@#      #@@@@@@@@@@@/    
    (@@@@@@@@@@@@@@@#      #@@@@@@@@@@@@@@@#
    @@@@@@@@@*&@@@@@#      #@@@@@&,@@@@@@@@@
     .#@%.    &@@@@@#      #@@@@@&    .#@%. 
              &@@@@@#      #@@@@@&          
              ,@@@@@#      #@@@@@,          
                  .##      ##.
`
export class TerminalView implements VirtualDOM {

    expanded$ = new BehaviorSubject(true)
    commands$ = new BehaviorSubject([invite, "Read more about the available commands <a href=''>here</a>"])
    command$ = new BehaviorSubject(">")
    contentElement: HTMLDivElement
    class = attr$(
        this.expanded$,
        (expanded) => expanded ? "w-100 h-50" : "w-100",
        {
            wrapper: (d) => `${d} w-100 d-flex flex-column flex-grow-1 `
        }
    )
    children: VirtualDOM[]

    connectedCallback: (elem: HTMLElement$ & HTMLDivElement) => void

    messages$: { [key: string]: ReplaySubject<ContextMessage> } = {
        'root': new ReplaySubject()
    }

    constructor(messages$: Observable<ContextMessage>) {

        messages$.subscribe(message => {
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
            new TerminalHeaderView(this.expanded$),
            child$(
                this.expanded$,
                (expanded) => expanded ? this.contentView() : {}
            )
        ]

        this.commands$.pipe(delay(0)).subscribe(() => {
            if (!this.contentElement)
                return
            this.contentElement.scrollTop = this.contentElement.scrollHeight
        })
    }


    contentView() {
        return {
            class: 'd-flex flex-column flex-grow-1 w-100 overflow-auto p-2',
            children: [
                {
                    children: childrenAppendOnly$(
                        this.commands$,
                        (command) => {
                            return {
                                tag: 'pre',
                                class: 'fv-text-success mx-auto w-100',
                                innerHTML: command
                            }
                        })
                },
                new NodeView('root', 0, true, this.messages$),
                child$(
                    this.command$,
                    (command) => this.inputView(command)
                )
            ],
            connectedCallback: (elem) => {
                this.contentElement = elem
                this.contentElement.scrollTop = this.contentElement.scrollHeight
                this.messages$['root'].subscribe(() => {
                    this.contentElement.scrollTop = this.contentElement.scrollHeight
                })
            }
        }
    }

    inputView(command) {

        return {
            class: 'd-flex align-items-center w-100',
            children: [
                {
                    innerText: command
                },
                {
                    class: 'flex-grow-1 px-2 ',
                    spellcheck: false,
                    contentEditable: true,
                    onkeypress: (ev) => {
                        if (ev.key == 'Enter') {
                            let command = ev.target.innerText
                            let r = this.interpretCommand(command)
                            this.commands$.next([">" + command, r].filter(d => d));
                            this.command$.next(">")
                        }
                    }
                }
            ]
        }
    }

    interpretCommand(command) {
        if (command == 'youwol') {
            return 'Hello YouWol'
        }
    }
}



class TerminalHeaderView implements VirtualDOM {

    public readonly class = 'd-flex align-items-center fv-bg-background-alt border fv-pointer'
    public readonly children: VirtualDOM[]
    public readonly onclick: (ev: MouseEvent) => void

    constructor(expanded$: BehaviorSubject<boolean>) {
        this.children = [
            {
                class: attr$(
                    expanded$,
                    (expanded) => expanded ? "fa-caret-down" : "fa-caret-right",
                    { wrapper: (d) => `fas ${d} p-2 fv-pointer` }
                )
            },
            {
                innerText: 'TERMINAL'
            }
        ]
        this.onclick = () => expanded$.next(!expanded$.getValue())
    }
}
