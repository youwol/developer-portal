import { attr$, child$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { Select } from '@youwol/fv-input'
import { TopBanner } from '@youwol/platform-essentials'
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs'
import { distinctUntilChanged, mergeMap, skip } from 'rxjs/operators'
import { AppState } from './app-state'
import { PyYouwol as pyYw } from '@youwol/http-clients'

export class UsersSelectView implements VirtualDOM {
    public readonly class = 'd-flex align-items-center'
    public readonly children: VirtualDOM[]

    constructor(environment: pyYw.EnvironmentStatusResponse) {
        const items = environment.users.map(
            (user) => new Select.ItemData(user, user),
        )

        const selected$ = new BehaviorSubject(environment.userInfo.email)

        const selectState = new Select.State(items, selected$)
        selectState.selectionId$
            .pipe(
                skip(1),
                distinctUntilChanged(),
                mergeMap((id) => {
                    return new pyYw.PyYouwolClient().admin.environment.login$({
                        email: id,
                    })
                }),
            )
            .subscribe()

        this.children = [
            {
                class: 'fas fa-users',
            },
            new Select.View({ state: selectState, class: 'mx-2' } as any),
        ]
    }
}

class YwUserMenuView extends TopBanner.Menu {
    constructor(params: { state: AppState }) {
        super({
            id: 'expandable-user-menu',
            sections: [
                new TopBanner.MenuSection({
                    items: [
                        new TopBanner.SettingsMenuItem({
                            state: params.state.topBannerState,
                        }),
                    ],
                }),
                new TopBanner.MenuSection({
                    items: [
                        child$(
                            params.state.environment$,
                            (env) => new UsersSelectView(env as any),
                        ) as any,
                    ],
                }),
            ],
        })
    }
}

class ProfilesSelectView implements VirtualDOM {
    public readonly class = 'd-flex align-items-center'
    public readonly children: VirtualDOM[]

    constructor(
        environment: pyYw.EnvironmentStatusResponse,
        inProgress$: Subject<boolean>,
    ) {
        const items = environment.configuration.availableProfiles.map(
            (profile) => new Select.ItemData(profile, profile),
        )

        const selectedProfile$ = new BehaviorSubject(
            environment.configuration.activeProfile,
        )

        const selectState = new Select.State(items, selectedProfile$)
        selectState.selectionId$
            .pipe(skip(1), distinctUntilChanged())
            .subscribe((id) => {
                console.warn('on select')
                inProgress$.next(true)
                new pyYw.PyYouwolClient().admin.environment
                    .switchProfile$({
                        active: id,
                    })
                    .subscribe(() => {
                        console.warn('on return of select')
                        inProgress$.next(false)
                    })
            })

        this.children = [
            {
                class: 'fas fa-user-cog',
            },
            new Select.View({ state: selectState, class: 'mx-2' } as any),
        ]
    }
}

class ReloadButton implements VirtualDOM {
    class: Stream$<boolean, string>
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
        this.class = attr$(
            spinning$,
            (isSpinning: boolean) => {
                console.warn(`spinning : ${isSpinning}`)
                return isSpinning ? ' fa-spin' : ''
            },
            {
                untilFirst: 'fa-spin',
                wrapper: (v: string) =>
                    `${v} fv-button fas fa-sync mx-1 fv-pointer fv-hover-text-secondary`,
            },
        )
        this.onclick = () => {
            this.loadInProgress$.next(true)
            new pyYw.PyYouwolClient().admin.environment
                .reloadConfig$()
                .subscribe(() => this.loadInProgress$.next(false))
        }
    }
}

class ConfigurationPickerView implements VirtualDOM {
    public readonly class = 'mx-5 d-flex align-items-center'
    public readonly children: VirtualDOM[]

    constructor(
        environment$: Observable<pyYw.EnvironmentStatusResponse>,
        loadInProgress$: Subject<boolean>,
    ) {
        this.children = [
            new ReloadButton(loadInProgress$),
            {
                class: 'd-flex align-items-center mr-4 ml-2',
                innerText: attr$(environment$, (env) =>
                    env.configuration.pathsBook.config.split('/').slice(-1),
                ),
                style: { 'font-size': 'large' },
            },
            child$(
                environment$,
                (env) => new ProfilesSelectView(env as any, loadInProgress$),
            ),
        ]
    }
}

class YwMenuView extends TopBanner.Menu {
    constructor(params: { state: AppState }) {
        super({
            id: 'expandable-yw-menu',
            sections: [
                new TopBanner.MenuSection({
                    items: [
                        child$(
                            params.state.environment$,
                            (environment: any) => {
                                return {
                                    class: 'd-flex align-items-center justify-content-center',
                                    children: [
                                        {
                                            class:
                                                'fas fa-wifi px-2 ' +
                                                (environment.remoteGatewayInfo
                                                    .connected
                                                    ? 'fv-text-success'
                                                    : 'fv-text-error'),
                                        },
                                        {
                                            innerText:
                                                environment.remoteGatewayInfo
                                                    .host,
                                        },
                                    ],
                                }
                            },
                        ) as any,
                    ],
                }),
            ],
        })
    }
}

/**
 * Top banner of the application
 */
export class TopBannerView extends TopBanner.YouwolBannerView {
    constructor(params: { state: AppState }) {
        const loadInProgress$ = new BehaviorSubject(false)
        super({
            state: params.state.topBannerState,
            customActionsView: {
                class: 'd-flex align-items-center justify-content-center flex-grow-1 flex-wrap',
                children: [
                    new ConfigurationPickerView(
                        params.state.environment$,
                        loadInProgress$,
                    ),
                ],
            },
            userMenuView: new YwUserMenuView(params),
            youwolMenuView: new YwMenuView(params),
        })
    }
}
