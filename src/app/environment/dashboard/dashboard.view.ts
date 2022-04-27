import { child$, VirtualDOM } from '@youwol/flux-view'
import { PyYouwol as pyYw, raiseHTTPErrors } from '@youwol/http-clients'
import { EnvironmentState } from '../environment.state'
import {
    AttributeView,
    DashboardSubTitle,
    DashboardTitle,
} from '../../common/utils-view'

export class DashboardView implements VirtualDOM {
    public readonly environmentState: EnvironmentState
    public readonly class = 'w-100 h-100 p-2 overflow-auto'
    public readonly children: VirtualDOM[]

    constructor(params: { environmentState: EnvironmentState }) {
        Object.assign(this, params)
        this.children = [
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
    public readonly environment: pyYw.EnvironmentStatusResponse
    public readonly children: VirtualDOM[]

    constructor(params: { environment: pyYw.EnvironmentStatusResponse }) {
        Object.assign(this, params)
        this.children = [
            new PathsView({
                pathsBook: this.environment.configuration.pathsBook,
            }),

            new CustomDispatchesView({
                customDispatches:
                    this.environment.configuration.customDispatches,
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

export class CustomDispatchesView implements VirtualDOM {
    public readonly class = 'overflow-auto mb-4'
    public readonly style = {
        width: 'fit-content',
    }
    public readonly children: VirtualDOM[]

    public readonly customDispatches: pyYw.CustomDispatch[]
    constructor(params: { customDispatches: pyYw.CustomDispatch[] }) {
        Object.assign(this, params)

        const dispatches$ = new pyYw.PyYouwolClient().admin.environment
            .queryCustomDispatches$()
            .pipe(raiseHTTPErrors())

        this.children = [
            new DashboardTitle({ title: 'Custom dispatches' }),
            child$(dispatches$, ({ dispatches }) => {
                return {
                    children: Object.entries(dispatches).map(
                        ([type, items]) => {
                            return {
                                children: [
                                    new DashboardSubTitle({
                                        title: type,
                                    }),
                                    ...items.map(
                                        (dispatch) =>
                                            new CustomDispatchView({
                                                dispatch,
                                            }),
                                    ),
                                ],
                            }
                        },
                    ),
                }
            }),
        ]
    }
}

export class CustomDispatchView {
    class = 'w-100 my-3 container'
    public readonly dispatch: pyYw.CustomDispatch

    public readonly children: VirtualDOM[]
    constructor(params: { dispatch: pyYw.CustomDispatch }) {
        Object.assign(this, params)

        this.children = [
            this.dispatch.status.activated != undefined
                ? this.activatedView()
                : undefined,
            ...Object.entries(this.dispatch.status).map(([k, v]) => {
                console.log(k, v)
                return {
                    class: 'row',
                    children: [
                        {
                            class: 'px-2 col-sm',
                            innerText: k,
                            style: { fontWeight: 'bolder' },
                        },
                        typeof v == 'boolean'
                            ? {
                                  class: v
                                      ? 'fas fa-check fv-text-success col'
                                      : 'fas fa-times fv-text-disabled col',
                              }
                            : {
                                  class: 'col-lg',
                                  innerText: v,
                              },
                    ],
                }
            }),
        ]
    }

    activatedView() {
        return {}
    }
}
