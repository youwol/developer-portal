import { ChildrenLike, VirtualDOM } from '@youwol/rx-vdom'
import { raiseHTTPErrors } from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'
import { EnvironmentState } from '../environment.state'
import { AttributeView, DashboardTitle } from '../../common'
import { mergeMap } from 'rxjs/operators'

/**
 * @category View
 */
export class DashboardView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
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
    public readonly children: ChildrenLike

    constructor(params: { environmentState: EnvironmentState }) {
        Object.assign(this, params)
        this.children = [
            {
                source$: this.environmentState.appState.environment$.pipe(
                    mergeMap(() =>
                        this.environmentState.client
                            .queryCowSay$()
                            .pipe(raiseHTTPErrors()),
                    ),
                ),
                vdomMap: (cowSay) => {
                    return {
                        style: {
                            width: 'fit-content',
                            fontWeight: 'bolder',
                        },
                        class: 'fv-text-secondary mx-auto',
                        tag: 'pre',
                        innerText: `${cowSay}`,
                    }
                },
            },
            {
                source$: this.environmentState.appState.environment$,
                vdomMap: (
                    environment: pyYw.Routers.Environment.EnvironmentStatusResponse,
                ) => {
                    return new EnvSummaryView({ environment })
                },
            },
        ]
    }
}

/**
 * @category View
 */
export class EnvSummaryView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
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
    public readonly children: ChildrenLike

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
export class PathsView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
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
    public readonly children: ChildrenLike

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
