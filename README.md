# rend - the pure JavaScript server-side renderer 

<pre>
                   _________
_________________________  /
__  ___/  _ \_  __ \  __  / 
_  /   /  __/  / / / /_/ /  
/_/    \___//_/ /_/\__,_/   
</pre>

A light-weight, no dependency, JavaScript renderer inspired by [Lit](https://lit.dev). While Lit is awesome for client side 
components, Rend provides a similar experience on the server-side. It's all standard, modern JavaScript using interpolation
which enables you to do any kind of JavaScript tricks you want without using some proprietary syntax. Your server side code 
and syntax is nearly the same as the client side.

Use Rend for server side and [Lit](https://lit.dev) web components for the client side. A perfect match. 

[Live Demo](https://rend-giosppuxqq-uc.a.run.app/)

I love constructive feedback, so please post any questions, feedback or ideas [here](https://github.com/treeder/rend/discussions).

[Subscribe here](https://thingster.app/orgs/treeder/spaces/rend) to get latest updates, tips and tricks.  

## Upgrading to 1.X

[See here](https://github.com/treeder/rend/discussions/36)

## Benefits

* No build - ie: zero build time!
* No lock-in
* No proprietary syntax like with other template engines
* Server side rendering
* Client side rendering - use web components! They are built into the browser and are awesome.

The philosophy behind this is based on islands architecture or components architecture where you server side render all the static
things for super fast first contentful paint then you hydrate the dynamic areas with JavaScript to make them usable. 

## Quickstart

This repo is Codespaces ready, just click the button below, then at the terminal run `make run`

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/treeder/rend?quickstart=1)

## Getting Started

Just install rend:

```sh
npm install treeder/rend
```

## Usage

### NEW - Islands / Component Islands / Slots

Whatever you want to call it, the [basic idea](https://thingster.app/things/qsXjgXN2TD6CsL5gpmVRd) is to server side render the layout of your app and static content, then drop in client side components for interactivity. So users get a lightning fast initial page load while still having all the interactivity we expect in an app.

First we make a `layout.js` file and we add content slots to it. This example has a navigation rail/drawer area and the main content area:

```js
export async function layout(d) {
    return `
    ${header(d)}

    <div class="container">
        <div class="flex" style="gap: 12px;">
            <div>${await slot('rail', d)}</div>
            <div>${await slot('main', d)}</div>
        </div>
    </div>

    ${footer(d)}
    `
}
```

Then you use that layout like this:

```js
// Initialize rend with your main layout:
let rend = new Rend({
    layout: layout,
    data: { apiURL },
})

// In your request handler:
let d = {
    // slotted content:
    rail: './views/drawer.js', // direct import, must have export a render function
    main: './views/index.js', // or use class components
    // the rest of your data
    name: "John Wick",
    car: "Mustang Boss 429",
    greeting: msg('Hello, how are you?', {
        id: 'greeting', // This is the localization ID to lookup in the es.js file
        locale: 'es', // Snag the user's locale from a cookie, or 'Accept-Language' or something instead of hardcoding here.
    }),
}
return rend.html(d)
```

Then make a JavaScript file for each view, we'll start with `views/index.js`:

```js
import { html } from 'rend'

export function render(d) {
  return html`
    <h2>Hello ${d.name}!</h2>
  `
}
```

To change the response status, simply add a status field:

```js
return rend.html({
   main: './views/404.js', 
   status: 404,
})
```

You can find a full example of this [here](https://github.com/treeder/rend/tree/2886f788da4a2b5ab51048b0eb51b98f0316f5d9/examples/bun-hono).

## Server Side Rendering - SSR

The examples above are all server side code. If you run it and view it, you'll see it render insanely fast.

Because this is all JavaScript based you can do everything as you normally would in JavaScript. Here's some examples:

#### Loops

Here's how to loop and output:

```js
export function render(d) {
  return html`
    <h2>Hello ${d.name}!</h2>
    These are your tasks for today:
    <ul>
      ${d.tasks.map(t) => `<li>${t.name}</li>`}
    </ul>
  `
}
```

#### Conditionals

```js
export function render(d) {
  return html`
    <h2>Hello ${d.name ? d.name : 'World'}!</h2>
  `
}
```

## Server Side Components

Server-side components are reusable classes that render on the server. These are generally static, but can contain client-side components
to make them interactive. 

The basic structure is to make a class with a render method. If you want to get the data object into it, create a `constructor` function like
the example below. 

Here is an example of a server-side component:

```js
import { html } from 'rend'

export class MyReusableComponent {
    constructor(d) {
        this.d = d
    }

    render(d) {
        return html`
        <div style="border: 1px solid blue; border-radius: 8px; padding: 10px;">
            <div class="mb-3">
                I am a reusable server-side component. <span class="blue">Hello ${this.d.name}.</span>
            </div>
            <div class="">
                <!-- This is a client-side web component: -->
                <script type="module">
                    import '/components/hello-world.js'
                </script>
                <hello-world name="${this.d.name}" car="${this.d.car}"></hello-world>
            </div>
        </div>
        `
    }
}
```

Then you can use it inside your pages `render` function:

```js
import { html } from 'rend'
import { MyReusableComponent } from './components/my-reusable-component.js'

export function render(d) {
    return html`
        <h3>Server-side components</h3>
        <div class="mt-3">
            ${new MyReusableComponent(d)}
        </div>
    `
}
```

## Using with various platforms


### Bun with Hono

This is the recommended path as Bun and Hono are more modern and use standard APIs whereas Node has it's own non-standard APIs. 

Example:

```js
app.get('/', async (c) => {
    let d = {
        name: "John Wick",
        car: "Mustang Boss 429",
    }
    return rend.html('./views/index.js', d)
})
```

That's it! Full example available at [examples/bun-hono](examples/bun-hono).

### Cloudflare Pages Functions

Very similar to the rest, here is an example `functions/index.js` that will serve at `/` in your Cloudflare Pages app:

```js
import { Rend, html } from 'rend'
import { header, footer } from './_layout.js'

let rend = new Rend({ header, footer, prod: true })

export function onRequest(context) {
    return rend.html(index, {name: 'Honey'})
}

function index(d) {
    return html`
      ${d.name}, I'm home!
    `
}
```

### Node with Fastify 

This is a fastify example, but you can do the same with Express or whatever you like to use. 

```js
import { Rend } from 'rend'
import { header, footer } from './views/layout.js'

// Initialize Rend with header and footer render functions:
let rend = new Rend({ header, footer }) // other options found in code such as prod: true for extra performance

fastify.get('/', async (request, reply) => {
    // The following will write the response using the template at index.js and a data object you can use in your template:
    return rend.send(reply, './views/index.js', {name: 'John Wick'})
})
```

To see the full example of this, see [examples/node-fastify](examples/node-fastify).

Start it up with `node server.js` and surf to https://localhost:3000. That's it!


## Client Side - Web Components

Web components are standard technology that is now supported in every major browser. This eliminates the need
to use things like React that were created before web components were a thing. Because it's part of the browser 
you'll get better performance, fast builds and no lock-in!

I recommend using [Lit](https://lit.dev) to help you use web components, it's a lightweight wrapper around the web components API.

### Quick example

Copy the following into a file called `hello-world.js`, make sure it's in a publicly accessible folder. 

```js
import {html, css, LitElement} from 'lit'

export class HelloWorld extends LitElement {
  static styles = css`p { color: blue }`

  static properties = {
    name: {type: String},
  }

  constructor() {
    super()
    this.name = 'Somebody'
  }

  render() {
    return html`<p>Hello, ${this.name}!</p>`
  }
}
customElements.define('hello-world', HelloWorld)
```

Then in your `render()` function for your view, just need to import and use it:

```js
<script type="module">
    import '/components/hello-world.js'
</script>
<hello-world name="${d.name}"></hello-world>
```

It's that simple! See the [example](examples/) apps for working examples.

## Localization

I recommend using the [Loco](https://github.com/treeder/loco) library as it's very simple and has some really
nice convenience features. The [example](/example) app uses it to show how easy it is.

The very nice thing is that it is Lit compatible you can use @lit/localize and loco with the same language
files. 

This is being used in the [example app](/example) and [demo](https://rend-giosppuxqq-uc.a.run.app/). 

## Other helpful functions

### stringify - a special version for web components

A little enhancement to JSON.stringify so that it works with HTML attributes. Use this if you want to pass objects into a web or Lit component.

NOTE: you do NOT need to use this if you are using the `html` tag function in your render method, it will automatically do this for you.

```js
import { Rend } from 'rend'
<my-component something="${Rend.stringify(obj)}"></my-component>
```

### head - generates a nice and optimized head section

A nice little function to generate a nice and optimized `<head>` section. It will help with lazy loading fonts, set all your opengraph and twitter 
meta tags, etc. 

Use this in your layout.js `header(d)` function:

```js
import {head} from 'rend/head.js'

export function header(d){
  // this can be your entire header function:
  return html`
  ${head({
    title: 'My web app!',
  })}
  `
}
```

See [examples](examples/) for more of the fields you can pass, like description, fonts, styles, etc.

## Good Practice Guidelines

Here's some things we find useful that make building your apps more consistent. 

### Errors

Use `cause` to wrap errors: 

```js
try {
  something()
} catch (err) {
  throw new Error("New error message", { cause: err })
}
```

Then you can check the cause with `err.cause`.

### API / HTTP Errors

Use the following:

```js
export class APIError extends Error {
    constructor(message, options) {
      super(message, options)
      this.status = options.status
    }

    toString() {
        return `${this.status} ${this.message}`;
    }
}
```

## Development

### Codespaces (recommended)

To get everything setup out of the box, simply open this repo in a codespace and run: `make run`.

### Local

Clone this repo.

Setup:

```sh
make install
```

Run:

```sh
make run
```

bump
