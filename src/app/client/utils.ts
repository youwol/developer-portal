import { Observable } from 'rxjs'

export function requestToJson$(request, extractFct = (d) => d) {
    return new Observable((observer) => {
        fetch(request)
            .then((response) => response.json())
            .then((data) => {
                observer.next(extractFct(data))
                observer.complete()
            })
            .catch((err) => observer.error(err))
    })
}

export function requestToText$(request, extractFct = (d) => d) {

    return new Observable((observer) => {
        fetch(request)
            .then((response) => response.text())
            .then((data) => {
                observer.next(extractFct(data))
                observer.complete()
            })
            .catch((err) => observer.error(err))
    })
}
