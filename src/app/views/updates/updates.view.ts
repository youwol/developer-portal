import { attr$, VirtualDOM, Stream$ } from "@youwol/flux-view";
import { childrenAppendOnly$ } from "@youwol/flux-view";
import { map } from "rxjs/operators";
import { AppState, Topic } from "src/app/app-state";
import { CheckUpdateResponse, UpdateStatus } from "src/app/client/models";
import { TerminalView } from "../projects/project/terminal/terminal.view";


export class UpdatesView implements VirtualDOM {

    public readonly class: Stream$<Topic, string>
    public readonly children: VirtualDOM[]
    public readonly state: AppState


    constructor(params: { state: AppState }) {
        Object.assign(this, params)


        this.class = attr$(
            this.state.selectedTopic$,
            (topic: Topic) => topic == 'Updates' ? ' d-flex' : 'd-none',
            {
                wrapper: (d) => `${d} w-100 h-100 flex-column`
            }
        )
        this.children = [
            new UpdatesReportView(params),
            new TerminalView(this.state.updatesEvents.messages$)
        ]
    }
}


export class UpdatesReportView implements VirtualDOM {

    public readonly class = "w-100 h-50 d-flex flex-column overflow-auto"

    public readonly children: VirtualDOM[]

    public readonly state: AppState

    constructor(params: { state: AppState }) {
        Object.assign(this, params)

        this.children = [
            {
                class: 'p-2 fv-pointer fv-bg-secondary border rounded',
                style: {
                    height: 'fit-content',
                    width: 'fit-content',
                },
                innerText: "Check updates",
                onclick: () => this.state.collectUpdates()
            },
            {
                class: 'flex-grow-1',
                children: [
                    {
                        tag: 'table',
                        class: '',
                        children: [
                            {
                                tag: 'tbody',
                                children: childrenAppendOnly$(
                                    this.state.updatesEvents.updateChecksResponse$.pipe(map(d => [d.data])),
                                    (d: CheckUpdateResponse) => {
                                        console.log(d)
                                        return this.rowView({
                                            name: d.packageName,
                                            localVersion: d.localVersionInfo.version,
                                            remoteVersion: d.remoteVersionInfo.version,
                                            status: d.status
                                        })
                                    },
                                    {
                                        orderingIndex: (data: CheckUpdateResponse) => {
                                            let orders: Record<UpdateStatus, number> = {
                                                'upToDate': 3,
                                                'mismatch': 2,
                                                'localAhead': 1,
                                                'remoteAhead': 0
                                            }
                                            return orders[data.status]
                                        }
                                    }
                                )
                                /*this.rowView({
                                    name: 'name', localVersion: 'local version',
                                    remoteVersion: 'remote version', status: status
                                })*/

                            }
                        ]
                    }
                ]
                /*
                children: childrenAppendOnly$(
                    this.state.updatesEvents.updateChecksResponse$.pipe(map(d => [d])),
                    (d: CheckUpdateResponse) => {
                        console.log(d)
                        return {
                            innerText: d
                        }
                    }
                )*/
            }
        ]
    }

    rowView({ name, localVersion, remoteVersion, status }:
        {
            name: string, localVersion: string, remoteVersion: string, status: string
        }) {

        return {
            tag: 'tr',
            children: [
                this.cellView(name),
                this.cellView(localVersion),
                this.cellView(remoteVersion),
                this.cellView(status),
                this.cellView('action')
            ]
        }
    }

    cellView(name: string) {
        return {
            tag: 'td',
            class: 'p-2',
            innerText: name
        }
    }
}


