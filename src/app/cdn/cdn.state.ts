import { AppState } from '../app-state'
import { BehaviorSubject, Observable } from 'rxjs'

import {
    filterCtxMessage,
    PyYouwol as pyYw,
    WebSocketResponse$,
} from '@youwol/http-clients'
import { map, shareReplay } from 'rxjs/operators'
import { PackageView } from './package/package.view'
import { LocalCdnRouter } from '@youwol/http-clients/src/lib/py-youwol/routers/local-cdn/local-cdn.router'

export class PackageEvents {
    public readonly client: LocalCdnRouter
    public readonly package: pyYw.CdnPackage
    public readonly info$: Observable<pyYw.CdnPackage>

    constructor(params: { package: pyYw.CdnPackage; client: LocalCdnRouter }) {
        Object.assign(this, params)
        this.info$ = this.client.webSocket
            .package$({
                packageId: this.package.id,
            })
            .pipe(
                map((wsMessage) => wsMessage.data),
                shareReplay(1),
            )

        this.client.getPackage$({ packageId: this.package.id }).subscribe()
    }
}

export class UpdateEvents {
    public readonly client: LocalCdnRouter
    /**
     * All messages related to updates
     */
    messages$: Observable<pyYw.ContextMessage>

    /**
     * update response on particular package
     */
    updateChecksResponse$: WebSocketResponse$<pyYw.CheckUpdateResponse>

    /**
     * update response on all packages
     */
    updatesChecksResponse$: WebSocketResponse$<pyYw.CheckUpdatesResponse>

    constructor(params: { client: LocalCdnRouter }) {
        Object.assign(this, params)
        this.messages$ = this.client.webSocket
            .ws$()
            .pipe(filterCtxMessage({ withAttributes: { topic: 'updatesCdn' } }))
        this.updateChecksResponse$ = this.client.webSocket.updateStatus$()
        this.updatesChecksResponse$ = this.client.webSocket.updatesStatus$()
    }
}

export class CdnState {
    public readonly cdnClient = new pyYw.PyYouwolClient().admin.localCdn
    public readonly appState: AppState
    public readonly updatesEvents: UpdateEvents

    public readonly packagesEvent: { [k: string]: PackageEvents } = {}

    public readonly status$: WebSocketResponse$<pyYw.CdnStatusResponse>
    public readonly packages$: Observable<pyYw.CdnPackage[]>
    public readonly downloadQueue$ = new BehaviorSubject<
        pyYw.DownloadPackageBody[]
    >([])
    public readonly openPackages$ = new BehaviorSubject<pyYw.CdnPackage[]>([])

    public readonly screensId = {}

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
        this.updatesEvents = new UpdateEvents({ client: this.cdnClient })
        this.status$ = this.cdnClient.webSocket.status$().pipe(shareReplay(1))
        this.packages$ = this.status$.pipe(
            map((status) => status.data.packages),
            shareReplay(1),
        )
        this.packages$.subscribe()
        this.cdnClient.getStatus$().subscribe()
    }

    openPackage(pack: pyYw.CdnPackage) {
        if (!this.packagesEvent[pack.name]) {
            this.packagesEvent[pack.name] = new PackageEvents({
                package: pack,
                client: this.cdnClient,
            })
        }

        const openPackages = this.openPackages$.getValue()

        if (!openPackages.includes(pack)) {
            this.openPackages$.next([...openPackages, pack])
        }
        this.screensId[pack.name] = this.appState.registerScreen({
            topic: 'CDN',
            viewId: pack.name,
            view: new PackageView({
                cdnState: this,
                package: pack,
            }),
        })
    }

    selectProject(packageName) {
        this.appState.selectScreen(this.screensId[packageName])
    }

    closePackage(pack: pyYw.CdnPackage) {
        delete this.packagesEvent[pack.name]
        this.appState.removeScreen(this.screensId[pack.name])
        const openPackages = this.openPackages$.getValue()
        this.openPackages$.next(openPackages.filter((p) => p.name != pack.name))
    }

    collectUpdates() {
        this.cdnClient.triggerCollectUpdates$()
    }

    insertInDownloadQueue(packageName: string, version: string) {
        const queued = this.downloadQueue$.getValue()
        this.downloadQueue$.next([
            ...queued.filter(
                (v) => v.packageName != packageName && v.version != version,
            ),
            { packageName, version },
        ])
    }

    removeFromDownloadQueue(packageName: string, version: string) {
        const queued = this.downloadQueue$.getValue()
        this.downloadQueue$.next([
            ...queued.filter(
                (v) => v.packageName != packageName && v.version != version,
            ),
        ])
    }

    toggleInDownloadQueue(packageName: string, version: string) {
        const queued = this.downloadQueue$.getValue()
        const base = queued.filter(
            (v) => v.packageName != packageName && v.version != version,
        )

        queued.find((v) => v.packageName == packageName && v.version == version)
            ? this.downloadQueue$.next(base)
            : this.downloadQueue$.next([...base, { packageName, version }])
    }

    proceedDownloads() {
        this.cdnClient.download$({
            body: {
                packages: this.downloadQueue$.getValue(),
                checkUpdateStatus: false,
            },
        })
    }
}
