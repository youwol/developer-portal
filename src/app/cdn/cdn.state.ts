import { AppState } from '../app-state'
import { BehaviorSubject, combineLatest, merge, Observable, of } from 'rxjs'

import { filterCtxMessage, WebSocketResponse$ } from '@youwol/http-primitives'
import * as pyYw from '@youwol/local-youwol-client'
import { map, scan, shareReplay } from 'rxjs/operators'
import { PackageView } from './package'

type LocalCdnRouter = pyYw.Routers.LocalCdn.LocalCdnRouter

/**
 * @category Event
 */
export class PackageEvents {
    /**
     * @group Immutable Constants
     */
    public readonly client: LocalCdnRouter

    /**
     * @group Immutable DOM Constants
     */
    public readonly packageId: string

    /**
     * @group Observables
     */
    public readonly info$: Observable<pyYw.Routers.LocalCdn.CdnPackage>

    constructor(params: { packageId: string; client: LocalCdnRouter }) {
        Object.assign(this, params)
        this.info$ = this.client.webSocket
            .package$({
                packageId: this.packageId,
            })
            .pipe(
                map((wsMessage) => wsMessage.data),
                shareReplay(1),
            )

        this.client.getPackage$({ packageId: this.packageId }).subscribe()
    }
}

/**
 * @category Event
 */
export class UpdateChecksEvents {
    /**
     * @group Immutable Constants
     */
    public readonly client: LocalCdnRouter
    /**
     * All messages related to updates
     * @group Observables
     */
    public readonly messages$: Observable<pyYw.ContextMessage>

    /**
     * update response on particular package
     * @group Observables
     */
    public readonly updateChecksResponse$: WebSocketResponse$<pyYw.Routers.LocalCdn.CheckUpdateResponse>

    /**
     * update response on all packages
     * @group Observables
     */
    public readonly updatesChecksResponse$: WebSocketResponse$<pyYw.Routers.LocalCdn.CheckUpdatesResponse>

    constructor(params: { client: LocalCdnRouter }) {
        Object.assign(this, params)
        this.messages$ = pyYw.PyYouwolClient.ws.log$.pipe(
            filterCtxMessage({ withAttributes: { topic: 'updatesCdn' } }),
        )
        this.updateChecksResponse$ = this.client.webSocket.updateStatus$()
        this.updatesChecksResponse$ = this.client.webSocket.updatesStatus$()
    }
}

export class ActualPackage {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly versions: string[],
    ) {}
}
export class FuturePackage {
    constructor(
        public readonly id: string,
        public readonly name,
        public readonly event: pyYw.Routers.System.DownloadEventType,
    ) {}
}

/**
 * @category State
 */
export class CdnState {
    /**
     * @group Immutable Constants
     */
    public readonly cdnClient = new pyYw.PyYouwolClient().admin.localCdn

    /**
     * @group States
     */
    public readonly appState: AppState

    /**
     * @group Events
     */
    public readonly updatesEvents: UpdateChecksEvents

    /**
     * @group Events
     */
    public readonly packagesEvent: { [k: string]: PackageEvents } = {}

    /**
     * @group Observables
     */
    public readonly status$: Observable<pyYw.Routers.LocalCdn.CdnStatusResponse>

    /**
     * @group Observables
     */
    public readonly packages$: Observable<(ActualPackage | FuturePackage)[]>

    /**
     * @group Observables
     */
    public readonly downloadedPackages$: Observable<pyYw.Routers.LocalCdn.DownloadedPackageResponse>

    /**
     * @group Observables
     */
    public readonly accDownloadedPackages$: Observable<
        pyYw.Routers.LocalCdn.DownloadedPackageResponse[]
    >

    /**
     * @group Observables
     */
    public readonly accDownloadEvent$: Observable<{
        [k: string]: pyYw.Routers.System.DownloadEvent
    }>

    /**
     * @group Observables
     */
    public readonly downloadQueue$ = new BehaviorSubject<
        pyYw.Routers.LocalCdn.DownloadPackageBody[]
    >([])

    /**
     * @group Observables
     */
    public readonly openPackages$ = new BehaviorSubject<string[]>([])

    /**
     * @group Mutable Variables
     */
    public readonly screensId = {}

    constructor(params: { appState: AppState }) {
        Object.assign(this, params)
        this.updatesEvents = new UpdateChecksEvents({ client: this.cdnClient })

        this.status$ = this.cdnClient.webSocket.status$().pipe(
            map((message) => message.data),
            shareReplay(1),
        )
        this.downloadedPackages$ = this.cdnClient.webSocket
            .downloadedPackage$()
            .pipe(
                map((message) => message.data),
                shareReplay(1),
            )
        this.accDownloadEvent$ =
            new pyYw.PyYouwolClient().admin.system.webSocket
                .downloadEvent$({ kind: 'package' })
                .pipe(
                    map((message) => message.data),
                    scan((acc, e) => ({ ...acc, [e.rawId]: e }), {}),
                    shareReplay(1),
                )

        this.accDownloadedPackages$ = merge(
            this.status$,
            this.downloadedPackages$,
        ).pipe(
            scan((acc, e) => {
                if (e['packages']) {
                    return []
                }
                return [...acc, e]
            }, []),
            shareReplay(1),
        )

        this.packages$ = combineLatest([
            this.status$,
            merge(of([]), this.accDownloadedPackages$),
            merge(of({}), this.accDownloadEvent$),
        ]).pipe(
            map(
                ([status, packages, downloadEvents]: [
                    pyYw.Routers.LocalCdn.CdnStatusResponse,
                    pyYw.Routers.LocalCdn.DownloadedPackageResponse[],
                    pyYw.Routers.System.DownloadEvent[],
                ]) => {
                    const starters = status.packages.map(
                        ({ id, name, versions }) =>
                            new ActualPackage(
                                id,
                                name,
                                versions.map((v) => v.version),
                            ),
                    )
                    const filterOutAlreadyHere = ({ id }) => {
                        return !starters.find((atStart) => atStart.id == id)
                    }
                    const downloaded = packages
                        .map(({ packageName, versions }) => ({
                            id: window.btoa(packageName),
                            name: packageName,
                            versions,
                        }))
                        .filter(filterOutAlreadyHere)
                        .map(
                            ({ id, name, versions }) =>
                                new ActualPackage(id, name, versions),
                        )

                    const fromEvents = Object.values(downloadEvents)
                        .map(({ rawId, type }) => ({
                            id: rawId,
                            name: window.atob(rawId),
                            type,
                        }))
                        .filter(filterOutAlreadyHere)
                        .filter(({ type }) => type != 'succeeded')
                        .map(
                            ({ id, name, type }) =>
                                new FuturePackage(id, name, type),
                        )
                    return [...starters, ...downloaded, ...fromEvents].sort(
                        (lhs, rhs) => lhs.name.localeCompare(rhs.name),
                    )
                },
            ),
            shareReplay(1),
        )
        this.packages$.subscribe()
        this.cdnClient.getStatus$().subscribe()
    }

    openPackage(packageId: string) {
        if (!this.packagesEvent[packageId]) {
            this.packagesEvent[packageId] = new PackageEvents({
                packageId,
                client: this.cdnClient,
            })
        }

        const openPackages = this.openPackages$.getValue()

        if (!openPackages.includes(packageId)) {
            this.openPackages$.next([...openPackages, packageId])
        }
        this.screensId[packageId] = this.appState.registerScreen({
            topic: 'CDN',
            viewId: packageId,
            view: new PackageView({
                cdnState: this,
                packageId: packageId,
            }),
        })
    }

    selectProject(packageName) {
        this.appState.selectScreen(this.screensId[packageName])
    }

    closePackage(packageId: string) {
        delete this.packagesEvent[packageId]
        this.appState.removeScreen(this.screensId[packageId])
        const openPackages = this.openPackages$.getValue()
        this.openPackages$.next(openPackages.filter((p) => p != packageId))
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
        this.cdnClient
            .download$({
                body: {
                    packages: this.downloadQueue$.getValue(),
                    checkUpdateStatus: false,
                },
            })
            .subscribe()
    }
}
