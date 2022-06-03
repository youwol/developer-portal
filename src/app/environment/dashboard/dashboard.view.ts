import { child$, VirtualDOM } from '@youwol/flux-view'
import { PyYouwol as pyYw, raiseHTTPErrors } from '@youwol/http-clients'
import { EnvironmentState } from '../environment.state'
import { AttributeView, DashboardTitle } from '../../common/utils-view'
import { mergeMap } from 'rxjs/operators'

export class DashboardView implements VirtualDOM {
    public readonly environmentState: EnvironmentState
    public readonly class = 'w-100 h-100 p-2 overflow-auto'
    public readonly children: VirtualDOM[]

    constructor(params: { environmentState: EnvironmentState }) {
        Object.assign(this, params)
        this.children = [
            child$(
                this.environmentState.appState.environment$.pipe(
                    mergeMap(() =>
                        this.environmentState.client
                            .queryCowSay$()
                            .pipe(raiseHTTPErrors()),
                    ),
                ),
                (cowSay) => {
                    return {
                        style: {
                            width: 'fit-content',
                            fontWeight: 'bolder',
                        },
                        class: 'fv-text-secondary mx-auto',
                        tag: 'pre',
                        innerText: cowSay,
                    }
                },
            ),
            child$(
                this.environmentState.appState.environment$,
                (environment) => {
                    return new EnvSummaryView({ environment })
                },
            ),
        ]
    }
}

export class EnvSummaryView implements VirtualDOM {
    public readonly class = 'mx-auto w-75'
    public readonly style = {
        width: 'fit-content',
    }
    public readonly environment: pyYw.EnvironmentStatusResponse
    public readonly children: VirtualDOM[]

    constructor(params: { environment: pyYw.EnvironmentStatusResponse }) {
        Object.assign(this, params)
        this.children = [
            new PathsView({
                pathsBook: this.environment.configuration.pathsBook,
            }),
        ]
    }
}

export class PathsView implements VirtualDOM {
    public readonly class = 'mb-4'
    public readonly pathsBook: pyYw.PathsBook
    public readonly children: VirtualDOM[]

    constructor(params: { pathsBook: pyYw.PathsBook }) {
        Object.assign(this, params)
        this.children = [
            new DashboardTitle({ title: 'Paths' }),
            ...Object.entries(this.pathsBook)
                .filter(
                    ([k, v]) => typeof k == 'string' && typeof v == 'string',
                )
                .map(([k, v]) => {
                    return new AttributeView({
                        text: k,
                        value: v,
                    })
                }),
        ]
    }
}
