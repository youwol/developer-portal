import {AttributeLike, ChildrenLike, VirtualDOM} from '@youwol/rx-vdom'
import {TopBannerView} from '@youwol/os-top-banner'
import {BehaviorSubject, Observable, Subject, timer} from 'rxjs'
import {AppState} from './app-state'
import * as pyYw from '@youwol/local-youwol-client'

class ReloadButton implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    class: AttributeLike<string>
    onclick: () => void

    constructor(private loadInProgress$: Subject<boolean>) {
        const spinning$ = new Subject<boolean>()
        let lastInProgress = Date.now()
        loadInProgress$.subscribe((inProgress) => {
            if (inProgress) {
                lastInProgress = Date.now()
                spinning$.next(true)
            } else {
                timer(new Date(lastInProgress + 1500)).subscribe(() =>
                    spinning$.next(false),
                )
            }
        })
        this.class = {
            source$: spinning$,
            vdomMap: (isSpinning: boolean) => {
                return isSpinning ? ' fa-spin' : ''
            },
            untilFirst: 'fa-spin',
            wrapper: (v: string) =>
                `${v} fv-button fas fa-sync mx-1 fv-pointer fv-hover-text-secondary`,
        }
        this.onclick = () => {
            this.loadInProgress$.next(true)
            new pyYw.PyYouwolClient().admin.environment
                .reloadConfig$()
                .subscribe(() => this.loadInProgress$.next(false))
        }
    }
}

class ConfigurationPickerView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class = 'mx-5 d-flex align-items-center'

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(
        environment$: Observable<pyYw.Routers.Environment.EnvironmentStatusResponse>,
        loadInProgress$: Subject<boolean>,
    ) {
        this.children = [
            new ReloadButton(loadInProgress$),
            {
                tag: 'div',
                class: 'd-flex align-items-center mr-4 ml-2',
                innerText: {
                    source$: environment$,
                    vdomMap: (
                        env: pyYw.Routers.Environment.EnvironmentStatusResponse,
                    ) =>
                        `${env.configuration.pathsBook.config
                            .split('/')
                            .slice(-1)}`,
                },
                style: { fontSize: 'large' },
            },
        ]
    }
}

class LocalConnectionView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'

    /**
     * @group Immutable DOM Constants
     */
    public readonly class: AttributeLike<string>

    /**
     * @group Immutable DOM Constants
     */
    public readonly style = {
        position: 'relative' as const,
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly customAttributes = {
        dataToggle: 'tooltip',
        title: 'Local py-youwol',
    }

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: { state: AppState }) {
        this.class = {
            source$: params.state.connectedLocal$,
            vdomMap: (isConnected: boolean) =>
                isConnected ? 'fv-text-success' : 'fv-text-error',
            wrapper: (d) => `fas  fa-network-wired  px-2 ${d}`,
        }
        this.children = [
            {
                tag: 'div',
                class: {
                    source$: params.state.connectedLocal$,
                    vdomMap: (isConnected: boolean) =>
                        isConnected
                            ? ''
                            : 'spinner-grow spinner-grow-sm text-secondary',
                },
                role: 'status',
                style: {
                    position: 'absolute',
                    top: '-5px',
                    left: '0px',
                },
            },
        ]
    }
}

class ConnectionView implements VirtualDOM<'div'> {
    /**
     * @group Immutable DOM Constants
     */
    public readonly tag = 'div'
    /**
     * @group Immutable DOM Constants
     */
    public readonly class: AttributeLike<string>

    /**
     * @group Immutable DOM Constants
     */
    public readonly children: ChildrenLike

    constructor(params: { state: AppState }) {
        this.class = {
            source$: params.state.connectedLocal$,
            vdomMap: (isConnected: boolean) =>
                isConnected ? '' : 'connectionView-bg-blur',
        }
        this.children = [
            {
                source$: params.state.environment$,
                vdomMap: (
                    environment: pyYw.Routers.Environment.EnvironmentStatusResponse,
                ) => {
                    // This has to be removed when upgrading http/clients to 1.0.5
                    // There is a mismatch: it is now (1.0.4) exposed (wrongly) as remoteGateway
                    const remoteInfo = environment['remoteGatewayInfo']
                    return {
                        tag: 'div',
                        style: {
                            source$: params.state.connectedLocal$,
                            vdomMap: (isConnected: boolean) =>
                                isConnected
                                    ? {}
                                    : {
                                          position: 'relative',
                                          zIndex: 5,
                                      },
                        },
                        class: 'd-flex align-items-center justify-content-center',
                        children: [
                            new LocalConnectionView({ state: params.state }),
                            {
                                tag: 'div',
                                class:
                                    'fas fa-wifi px-2 ' +
                                    (remoteInfo.connected
                                        ? 'fv-text-success'
                                        : 'fv-text-error'),
                            },
                            {
                                tag: 'div',
                                innerText: `${remoteInfo.host}`,
                            },
                        ],
                    }
                },
            },
        ]
    }
}

/**
 * Top banner of the application
 */
export class DevPortalTopBannerView extends TopBannerView {
    constructor(params: { state: AppState }) {
        const loadInProgress$ = new BehaviorSubject(false)
        super({
            innerView: {
                tag: 'div',
                class: 'd-flex align-items-center justify-content-around flex-grow-1 flex-wrap',
                children: [
                    new ConnectionView({ state: params.state }),
                    new ConfigurationPickerView(
                        params.state.environment$,
                        loadInProgress$,
                    ),
                ],
            },
        })
    }
}
