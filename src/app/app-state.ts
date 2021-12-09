import { YouwolBannerState } from "@youwol/platform-essentials"
import { Observable, ReplaySubject } from "rxjs"
import { filter, shareReplay, tap } from "rxjs/operators"
import { PyYouwolClient } from "./client/py-youwol.client"
import { Environment } from "./client/models"



export class AppState {


    public readonly environment$: Observable<Environment>

    public readonly topBannerState = new YouwolBannerState()

    constructor() {

        this.environment$ = PyYouwolClient.connectWs().pipe(
            filter((message: any) => {
                return message.type == "Environment"
            }),
            tap((env: Environment) => {
                console.log("Environment changes", env)
            }),
            shareReplay(1)
        )
        PyYouwolClient.environment.status$().subscribe()
    }
}


