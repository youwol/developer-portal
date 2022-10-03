import { attr$, child$, Stream$, VirtualDOM } from '@youwol/flux-view'
import { Select } from '@youwol/fv-input'
import { TopBannerView } from '@youwol/os-top-banner'
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs'
import { distinctUntilChanged, mergeMap, skip } from 'rxjs/operators'
import { AppState } from './app-state'
import * as pyYw from '@youwol/local-youwol-client'

export class UsersSelectView implements VirtualDOM {
    public readonly class = 'd-flex align-items-center'
    public readonly children: VirtualDOM[]

    constructor(
        environment: pyYw.Routers.Environment.EnvironmentStatusResponse,
    ) {
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
                        body: { email: id },
                    })
                }),
            )
            .subscribe()

        this.children = [
            {
                class: 'fas fa-users',
            },
            new Select.View({ state: selectState, class: 'mx-2' } as {
                state: Select.State
                class: string
            }),
        ]
    }
}

class ProfilesSelectView implements VirtualDOM {
    public readonly class = 'd-flex align-items-center'
    public readonly children: VirtualDOM[]

    constructor(
        environment: pyYw.Routers.Environment.EnvironmentStatusResponse,
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
                inProgress$.next(true)
                new pyYw.PyYouwolClient().admin.environment
                    .switchProfile$({
                        body: { active: id },
                    })
                    .subscribe(() => {
                        inProgress$.next(false)
                    })
            })

        this.children = [
            {
                class: 'fas fa-user-cog',
            },
            new Select.View({ state: selectState, class: 'mx-2' } as {
                state: Select.State
                class: string
            }),
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
        environment$: Observable<pyYw.Routers.Environment.EnvironmentStatusResponse>,
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
                (env) => new ProfilesSelectView(env, loadInProgress$),
            ),
        ]
    }
}

class ConnectionView implements VirtualDOM {
    public readonly children: VirtualDOM[]

    constructor(params: { state: AppState }) {
        this.children = [
            child$(
                params.state.environment$,
                (
                    environment: pyYw.Routers.Environment.EnvironmentStatusResponse,
                ) => {
                    // This has to be removed when upgrading http/clients to 1.0.5
                    // There is a mismatch: it is now (1.0.4) exposed (wrongly) as remoteGateway
                    const remoteInfo = environment['remoteGatewayInfo']
                    return {
                        class: 'd-flex align-items-center justify-content-center',
                        children: [
                            {
                                class:
                                    'fas fa-wifi px-2 ' +
                                    (remoteInfo.connected
                                        ? 'fv-text-success'
                                        : 'fv-text-error'),
                            },
                            {
                                innerText: remoteInfo.host,
                            },
                        ],
                    }
                },
            ),
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
                class: 'd-flex align-items-center justify-content-around flex-grow-1 flex-wrap',
                children: [
                    new ConnectionView({ state: params.state }),
                    new ConfigurationPickerView(
                        params.state.environment$,
                        loadInProgress$,
                    ),
                    child$(
                        params.state.environment$,
                        (env) => new UsersSelectView(env),
                    ),
                ],
            },
        })
    }
}
