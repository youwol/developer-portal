import { render } from '@youwol/flux-view'
import { AppView } from './app-view'
import { PyYouwolClient } from '@youwol/local-youwol-client'
import { take } from 'rxjs/operators'

require('./style.css')

PyYouwolClient.startWs$()
    .pipe(take(1))
    .subscribe(() => {
        const vDOM = new AppView()
        document.body.appendChild(render(vDOM))
    })
