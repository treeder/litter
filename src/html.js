import { stringify } from './stringify.js'

export function html(strings, ...keys) {
    // I'm sure there's a more efficient way to do this...
    // let values = []
    let r = ''
    // console.log("KEYS:", keys)
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i]
        // console.log("KEY:", i, key)
        let s = renderValue(key)
        // in case a function returns an object above the first time, let's do one more pass through so it renders properly
        s = renderValue(s)
        r += strings[i] + s
    }
    r += strings[strings.length - 1]
    // console.log("R:", r)
    // return String.raw(strings, ...values)
    return r
}

function renderValue(key) {
    let s = ''
    if (typeof key === 'undefined' || key === null) {
        s = ''
    } else if (typeof key === 'string') {
        // console.log("STRING:", key)
        s = key
    } else if (typeof key === 'function') {
        s = key()
    } else if (Array.isArray(key)) {
        // console.log("ARRAY:", key)
        s = key.join('')
    } else if (typeof key === 'object') {
        // console.log("OBJECT:", key)
        if ('render' in key) {
            s = key.render()
        } else {
            s = key.toString()
        }
    } else {
        s = key.toString()
    }
    return s
}
