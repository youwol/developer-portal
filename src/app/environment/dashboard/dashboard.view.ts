import { child$, VirtualDOM } from '@youwol/flux-view'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'
import { EnvironmentState } from '../environment.state'
import { AttributeView, DashboardTitle } from '../../common'
import { mergeMap } from 'rxjs/operators'

/**
 * @category View
 */
export class DashboardView implements VirtualDOM {
    /**
     * @group States
     */
    public readonly environmentState: EnvironmentState

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'w-100 h-100 p-2 overflow-auto'

    /**
     * @group Immutable DOM Constants
     */
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

/**
 * @category View
 */
export class EnvSummaryView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'mx-auto w-75'

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        width: 'fit-content',
    }

    /**
     * @group Immutable Constants
     */
    public readonly environment: pyYw.Routers.Environment.EnvironmentStatusResponse

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: {
        environment: pyYw.Routers.Environment.EnvironmentStatusResponse
    }) {
        Object.assign(this, params)
        this.children = [
            new PathsView({
                pathsBook: this.environment.configuration.pathsBook,
            }),
        ]
    }
}

/**
 * @category View
 */
export class PathsView implements VirtualDOM {
    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'mb-4'

    /**
     * @group Immutable Constants
     */
    public readonly pathsBook: pyYw.Routers.Environment.PathsBook

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: VirtualDOM[]

    constructor(params: { pathsBook: pyYw.Routers.Environment.PathsBook }) {
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
