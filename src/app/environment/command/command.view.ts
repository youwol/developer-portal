import { EnvironmentState, Method } from '../environment.state'
import { child$, VirtualDOM } from '@youwol/flux-view'
import { PyYouwol as pyYw } from '@youwol/http-clients'
import { AttributeView, DashboardTitle } from '../../common/utils-view'
import { from, Observable, Subject } from 'rxjs'
import { ObjectJs } from '@youwol/fv-tree'
import { install } from '@youwol/cdn-client'
import { mergeMap, withLatestFrom } from 'rxjs/operators'

function fetchCodeMirror$(): Observable<any> {
    return from(
        install({
            modules: ['codemirror'],
            scripts: ['codemirror#5.52.0~mode/javascript.min.js'],
            css: [
                'codemirror#5.52.0~codemirror.min.css',
                'codemirror#5.52.0~theme/blackboard.min.css',
            ],
        }),
    )
}

export class CommandView implements VirtualDOM {
    public readonly class = 'p-2'
    public readonly children: VirtualDOM[]

    public readonly environmentState: EnvironmentState
    public readonly command: pyYw.Command
    constructor(params: {
        environmentState: EnvironmentState
        command: pyYw.Command
    }) {
        Object.assign(this, params)
        let method: Method = 'GET'
        if (this.command['do_post'] != null) {
            method = 'POST'
        }
        if (this.command['do_delete'] != null) {
            method = 'DELETE'
        }
        if (this.command['do_put'] != null) {
            method = 'PUT'
        }
        const url = `/admin/custom-commands/${this.command.name}`
        this.children = [
            new AttributeView({ text: 'Method', value: method }),
            new AttributeView({
                text: 'URL',
                value: url,
            }),
            method == 'GET' || method == 'DELETE'
                ? new ExecuteNoBodyView({
                      environmentState: this.environmentState,
                      command: this.command,
                      method,
                      url,
                  })
                : new ExecuteBodyView({
                      environmentState: this.environmentState,
                      command: this.command,
                      method,
                      url,
                  }),
        ]
    }
}

export class ExecuteView implements VirtualDOM {
    public readonly class = 'my-3 d-flex flex-column'

    public readonly environmentState: EnvironmentState
    public readonly method: Method
    public readonly url: string
    public readonly output$ = new Subject()
    constructor(params: {
        environmentState: EnvironmentState
        command: pyYw.Command
        method: Method
        url: string
    }) {
        Object.assign(this, params)
    }
}

export class ExecuteNoBodyView extends ExecuteView {
    public readonly children: VirtualDOM[]

    constructor(params) {
        super(params)
        Object.assign(this, params)

        this.children = [
            new DashboardTitle({ title: 'Execute command' }),
            new PlayButtonView({
                onclick: () =>
                    this.environmentState
                        .executeNoBodyCommand$({
                            url: this.url,
                            method: this.method,
                        })
                        .subscribe((out) => this.output$.next(out)),
            }),
            child$(this.output$, (output) => new OutputView({ output })),
        ]
    }
}

export class ExecuteBodyView extends ExecuteView {
    public readonly children: VirtualDOM[]
    constructor(params) {
        super(params)

        const bodyView = new BodyView({})
        const playView = new PlayButtonView({})
        playView.click$
            .pipe(
                withLatestFrom(bodyView.body$),
                mergeMap(([, body]) =>
                    this.environmentState.executeWithBodyCommand$({
                        url: this.url,
                        body: JSON.parse(body),
                        method: this.method,
                    }),
                ),
            )
            .subscribe((out) => this.output$.next(out))

        this.children = [
            new DashboardTitle({ title: 'Execute command' }),
            bodyView,
            playView,
            child$(this.output$, (output) => new OutputView({ output })),
        ]
    }
}

export class PlayButtonView implements VirtualDOM {
    public readonly class =
        'fv-pointer p-1 fv-bg-secondary fv-hover-xx-lighter rounded border d-flex align-items-center'
    public readonly style = {
        width: 'fit-content',
    }
    public readonly children: VirtualDOM[]
    public readonly click$ = new Subject()
    public readonly onclick = (ev) => {
        this.click$.next(ev)
    }
    constructor(params: {}) {
        Object.assign(this, params)
        this.children = [{ class: 'fas fa-play px-2' }]
    }
}

export class BodyView implements VirtualDOM {
    public readonly class = 'my-1 d-flex flex-column'
    public readonly children: VirtualDOM[]

    public readonly codeMirrorConfiguration = {
        lineNumbers: true,
        theme: 'blackboard',
        lineWrapping: false,
        indentUnit: 4,
        mode: 'javascript',
    }
    public readonly style = {
        fontSize: 'small',
        height: '250px',
    }
    public readonly body$ = new Subject<string>()
    constructor(params: {}) {
        Object.assign(this, params)
        this.children = [
            {
                innerText: "Command's body (json format):",
            },
            child$(fetchCodeMirror$(), () => {
                return {
                    class: 'flex-grow-1',
                    connectedCallback: (htmlElement) => {
                        const config = {
                            ...this.codeMirrorConfiguration,
                            value: '{}',
                        }
                        const editor = window['CodeMirror'](htmlElement, config)
                        editor.on('changes', (_, changeObj) => {
                            if (
                                changeObj.length == 1 &&
                                changeObj[0].origin == 'setValue'
                            ) {
                                return
                            }
                            this.body$.next(editor.getValue())
                        })
                    },
                }
            }),
        ]
    }
}

export class OutputView implements VirtualDOM {
    public readonly class = 'my-3'
    public readonly children: VirtualDOM[]
    public readonly output: unknown

    constructor(params: { output: unknown }) {
        Object.assign(this, params)
        this.children = [
            new DashboardTitle({ title: 'Output' }),
            new ObjectJs.View({
                state: new ObjectJs.State({
                    title: 'response',
                    data: this.output,
                }),
            }),
        ]
    }
}
