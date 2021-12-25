# scenic.js

A TypeScript library to render scenes on a `<canvas>` element.

## Features

scenic.js uses a _scene_ which describes, what is to be painted on a `<canvas>` element. You define
the scene in terms of Javascript objects. You need to create a `Scenic` object, which manages a 
single underlying `<canvas>` and updates it accordingly. 

scenic support several user interactions such as
* zooming
* moving the scene around
* selecting certain elements
* moving selected elements around
* painting on the canvas

scenic.js works on both laptop/desktop computers that use a mouse as well as touch-enabled devices 
using either a finger or a stylus pen.

scenic.js requires a modern browser that supports 
* [`<canvas>`](https://caniuse.com/canvas)
* [`Path2d`](https://caniuse.com/path2d)
* [touchevents](https://caniuse.com/touch)

Basically, this means that all recent versions of Firefox and Chromium-based browsers (such as 
Chrome or Edge) are supported pretty well.

Except for build and testing tools, scenic.js has no dependencies on other libraries.

scenic.js is written using [TypeScript](https://www.typescriptlang.org/). This means that all type
declarations are "first-class" citizens of the code base. It is highly recommended to use TypeScript
for projects using scenic.js.

## Installation

You can install scenic.js via npm or similar:

```shell
$ npm i --save @halimath/scenic
```

## Usage

**ToDo**

## Author

scenic.js is written and maintained by [Alexander Metzner](https://github.com/halimath).

## License

Copyright (c) 2021 Alexander Metzner.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.