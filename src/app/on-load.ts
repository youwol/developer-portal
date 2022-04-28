import { render } from '@youwol/flux-view'
import { AppView } from './app-view'
import { PyYouwol } from '@youwol/http-clients'
import { take } from 'rxjs/operators'

require('./style.css')

new PyYouwol.PyYouwolClient()
    .webSocket$()
    .pipe(take(1))
    .subscribe(() => {
        const vDOM = new AppView()
        document.body.appendChild(render(vDOM))
    })
