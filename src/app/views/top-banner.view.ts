import { child$, VirtualDOM } from "@youwol/flux-view";
import { Select } from "@youwol/fv-input";
import { Menu, MenuSection, SettingsMenuItem, YouwolBannerView } from "@youwol/platform-essentials";
import { BehaviorSubject, from } from "rxjs";
import { distinctUntilChanged, map, mergeMap, skip } from "rxjs/operators";
import { AppState } from "../app-state";
import { PyYouwolClient } from "../client/py-youwol.client";
import { Environment } from "../client/models";


export class UsersSelectView implements VirtualDOM {

    public readonly class = 'd-flex align-items-center'
    public readonly children: VirtualDOM[]

    constructor(environment: Environment) {

        let items = environment.users.map(user => new Select.ItemData(user, user))

        let selected$ = new BehaviorSubject(environment.userInfo.email)

        let selectState = new Select.State(items, selected$)
        selectState.selectionId$.pipe(
            skip(1),
            distinctUntilChanged(),
            mergeMap((id) => {
                return PyYouwolClient.environment.login$({ email: id })
            })
        ).subscribe(() => { })

        this.children = [
            {
                class: "fas fa-users"
            },
            new Select.View({ state: selectState, class: 'mx-2' } as any)
        ]
    }
}




class YwUserMenuView extends Menu {

    constructor(params: { state: AppState }) {
        super({
            id: 'expandable-user-menu',
            sections: [
                new MenuSection({
                    items: [
                        new SettingsMenuItem({ state: params.state.topBannerState })
                    ]
                }),
                new MenuSection({
                    items: [
                        child$(
                            params.state.environment$,
                            (env) => new UsersSelectView(env)
                        ) as any
                    ]
                }),
            ]
        })
    }
}


class ConfigurationPickerView implements VirtualDOM {

    public readonly class = "mx-5"
    public readonly children: VirtualDOM[]

    constructor(environment: Environment) {
        this.children = [
            {
                class: 'd-flex align-items-center',
                children: [
                    this.configurationPathView(environment)
                ]
            }
        ]
    }

    configurationPathView(environment: Environment): VirtualDOM {

        return {
            class: 'fv-pointer',
            innerText: environment.configuration.pathsBook.config.split('/').slice(-1),
            style: { 'font-size': 'large' }
        }
    }
}

class YwMenuView extends Menu {

    constructor(params: { state: AppState }) {
        super({
            id: 'expandable-yw-menu',
            sections: [
                new MenuSection({
                    items: [
                        child$(
                            params.state.environment$,
                            (environment) => {
                                return {
                                    class: 'd-flex align-items-center justify-content-center',
                                    children: [
                                        {
                                            class: "fas fa-wifi px-2 " + (environment.remoteGatewayInfo.connected ? "fv-text-success" : "fv-text-error")
                                        },
                                        {
                                            innerText: environment.remoteGatewayInfo.host
                                        }
                                    ]
                                }
                            }
                        ) as any
                    ]
                })
            ]
        })
    }
}
/**
 * Top banner of the application
 */
export class TopBannerView extends YouwolBannerView {

    constructor(params: { state: AppState }) {
        super({
            state: params.state.topBannerState,
            customActionsView: {
                class: 'd-flex align-items-center justify-content-center flex-grow-1 flex-wrap',
                children: [
                    child$(
                        params.state.environment$,
                        (environment) => new ConfigurationPickerView(environment)
                    )
                ]
            },
            userMenuView: new YwUserMenuView(params),
            youwolMenuView: new YwMenuView(params)
        })
    }
}

