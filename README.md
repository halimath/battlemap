# battlemap

[![CI Status](https://github.com/halimath/battlemap/workflows/CI/badge.svg)](https://github.com/halimath/battlemap/actions/workflows/ci.yml)
[![CD Status](https://github.com/halimath/battlemap/workflows/CD/badge.svg)](https://github.com/halimath/battlemap/actions/workflows/cd.yml)

A virtual table top (VTT) web-based battle map editor and viewer for playing role-playing games remotely, 
specificially targetting [Fate Core](https://www.evilhat.com/home/fate-core/) (but works with any rpg).

## About

This repo contains a web application that supports people playing any kind of _Fate Core_ based role playing
game remotely using whatever video conferencing tool they like. This app provides a battle map for easier
handling of combat situations.

The app allows the Game Master (GM) to draw a scene (with support for touch devices and stylus pens), draw
"zones" (which are important in Fate) and place tokens which can be moved around. The drawing canvas has
infinite size so the combat can evolve in whatever direction the story advances. Players can join the map
and view it allowing them to move the scene and zoom in/out. All changes made by the GM are reflected in the
players view.

# Development

The backend is implemented using Golang. The frontend is implemented using TypeScript and the 
[wecco framework](https://github.com/weccoframework/core). Almost all CSS is coming from 
[Tailwind](https://tailwindcss.com/) with minimal CSS being written to embed the Fate Core font for displaying
dice results. The battlemap editor and viewer are created as a separate module and are published as web
components for easy embedding in other apps. The canvas drawing is handled by [`@halimath/scenic](./scenic)
which is contained in this repo but intentions are to move it to its own repo once feature set and maturity
are relatively stable.

## Local Environment

For being able to develop the app, you should have a local install of
* Golang >= 1.18beta2
* Node v16
* NPM (>=8.1)

You should also have an IDE which supports TypeScript. VSCode works perfectly, IntelliJ IDEA works,
too. I haven't tried other IDEs, but the should work the same.

To start development, you need to open four terminal (tabs) for each of the following directories:
* scenic
* battlemap
* app
* backend

Run the following command in each of the first three terminals:

```shell
$ npm i
$ npm start
```

and run 

```shell
$ go run .
```

in the third one. This will start the dev server and bring up the app on `localhost:3000`. The backend runs on
`localhost:8080` but only the rest api backend part is needed.

## CI/CD

All parts of the application are wrapped in a single OCI container build with `docker`. The container build 
uses multiple stages and builds the whole app as part of the container build. The final container will only 
contain the compiled application, though.

We use [Github Actions](https://github.com/features/actions) to build the application, run the tests, build
the container image and publish it to [https://ghcr.io](https://github.com/features/packages).

# License

Copyright 2021, 2022 Alexander Metzner.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
