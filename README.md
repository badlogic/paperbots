# Paperbots
[![Build Status](https://travis-ci.org/badlogic/paperbots.svg?branch=master)](https://travis-ci.org/badlogic/paperbots)

[Paperbots](https://paperbots.io) is a browser-based programming environment geared towards beginners, teachers, as well as programmers who want a simple creative outlet.

# Development
Paperbots consists of a frontend written in TypeScript, and a backend written in Java.

## Frontend

### Setup
To work on the front end code, that is the website and the compiler and virtual machine for Paperbots' programming language Wee, you will need to install the following:

* [Node](https://nodejs.org/en/), ensure it's available in your `PATH` on the command line.
* [Visual Studio Code](https://code.visualstudio.com/), with the following extensions
	* [Comment tagged templates](https://marketplace.visualstudio.com/items?itemName=bierner.comment-tagged-templates), which makes all the inline DOM generation code much nicer to work with.
	* [PEG.js language support](https://marketplace.visualstudio.com/items?itemName=SirTobi.pegjs-language), providing syntax highlighting for the grammar file in [`client/src/language/grammar.pegjs`](client/src/language/grammar.pegjs).

Once everything is installed, open a shell, navigate to the `client` directory and execute:

```
npm install
```

This will pull down all the dependencies of the front end code into the `node_modules/` folder.

### Architecture
The Paperbots frontend is contained in the [`client/`](client/) directory:

* [`tsconfig.json`](client/tsconfig.json): the configuration for the TypeScript compiler.
* [`package.json`](client/package.json): the NPM configuration defining dependencies as well as scripts for building and testing the frontend.
* [`lite-server.json`](client/lite-server.json) the configuration used for [lite-server](https://github.com/johnpapa/lite-server) in the `dev-without-java` script defined in `package.json`.
* [`site/`](client/site): static content like HTML files, CSS files, images, fonts, and 3rd party JavaScript dependencies in `.js` file form.
* [`src/`](client/src): TypeScript code driving the site.
* [`test/`](client/test): headless tests for the compiler and virtual machine.

#### 3rd party dependencies
Paperbots has a dependency on:

* [CodeMirror](https://codemirror.net/), for the code editor.
* [JQuery](https://jquery.com/), use for AJAX, and script side DOM element creation.
* [Require.js](https://requirejs.org/), used to load the TypeScript code as a module.

The dependencies are manually vendored in the [`site/js/`](client/site/js) folder for now, as I can not be bothered to figure out Parcel/Webpack/$JS_THING_DU_JOUR (fight me).

They are also referenced in the [`package.json`](client/package.json) file as development dependencies, including their typings for TypeScript.

Eventually the bullet will be bitten and Parcel or Webpack will package and minify everything.

#### CSS
All site specific CSS is contained in [`site/css/styles.css`](client/site/css/styles.css), except for the CodeMirror style sheet, the CodeMirror theme style sheet ([monokai.css](client/site/css/monokai.css)), and the FontAwesome style sheet.

The main style sheet has entries for HTML elements, components like buttons, widgets, and the layout of individual pages. At the bottom you find big nasty media queries to make the site somewhat work on mobile devices.

Eventually the bullet will be bitten and SASS will help untangle this specific clusterfuck.

#### Pages, widgets, and the event bus
Each page of the site consists of two parts: its `.html` file contained in [`site/`](client/site), and its TypeScript counter-part contained in [`src/`](client/src), following the naming scheme `<PageName>Page.ts`.

The `.html` file pulls in the CSS, 3rd party dependencies, and [`site/js/paperbots.js`](client/site/js/paperbots.js) file, the output of the TypeScript compiler.

Almost all `.html` files are pretty much void of DOM elements and instead call into their TypeScript counter part. E.g. `index.html` hands control to the TypeScript `IndexPage` class, which then constructs the DOM of the page. This is the general pattern used for all pages of the Paperbots site.

Each page on the TypeScript side generates a DOM made out of widgets (see [`src/widgets/`](client/src/widgets/)). The widgets are re-usable and loosely coupled via a simple event bus. A widget implements the [`Widget`](client/src/widgets/Widget.ts) interface, which has the method `render()`, returning a DOM tree representing the widget, and the method `onEvent()`, called whenever another widget has fired an event.

when the [`EditorWidget`](client/src/widgets/Editor.ts) sees a change to its content, it recompiles the source, and tells all other widgets on the page about it. The other widgets can then react, e.g. the debugger widget may disable its buttons so the user can not run a program that doesn't compile.

All events and the event bus itself are defined in [`src/widgets/Events.ts`](client/src/widgets/Events.ts).

#### Server communication
All communication with the server goes through the [`Api`](client/src/Api.ts) class.

### Development without backend
If you want to just mess around with the language compiler and virtual machine, add new pages or widgets, or pretty up the CSS, you don't necessarily need to run the backend. In essence, any work that doesn't require project or account management can be done without the backend running.

To start working like this, invoke the following NPM task from the `client/` directory:

```
npm run dev-without-java
```

This will:
* Fire up the PEG.js compiler which re-generates the `Parser.ts` file everytime the [`grammar.pegjs`](client/src/language/grammar.pegjs) file changes.
* Fire up the TypeScript compiler in watch mode. Any change you make to files in the `src/` directory will be recompiled, and the `client/site/js/paperbots.js` file will be regenerated.
* Fire up the lite-server instance, serving the front end on `http://localhost:8000`. It will reload the website in the browser if any files in the `site/` directory have changed.

With this setup, you can simply modify any file and see your changes in the browser immediately. The TypeScript compiler is configured to output source maps, so you can debug the original TypeScript source using the Safari/Firefox/Chrome/Edge development tools.

### Development with backend
Some frontend work, namely anything requiring account management or loading and storing projects, requires the backend to be running. Please check the backend section below on how to setup your workspace for backend development, and how to run a local instance. The backend instance will serve the content from the `site/` folder on `http://localhost:8001`.

Once the backend is running, you can invoke the following NPM task from the `client/` directory:

```
npm run dev
```

This will:
* Fire up the PEG.js compiler which re-generates the `Parser.ts` file everytime the [`grammar.pegjs`](client/src/language/grammar.pegjs) file changes.
* Fire up the TypeScript compiler in watch mode. Any change you make to files in the `src/` directory will be recompiled, and the `client/site/js/paperbots.js` file will be regenerated.
* Connect to the backend via websockets. The backend will notify the site in the browser of changes, triggering a page reload.

With this setup, you can simply modify any file and see your changes in the browser immediately. The TypeScript compiler is configured to output source maps, so you can debug the original TypeScript source using the Safari/Firefox/Chrome/Edge development tools.

### Testing
The `package.json` file comes with a `test` script you can invoke:

```
npm run test
```

This runs the tests in [`test/`](client/test/). [Mocha](https://mochajs.org/) is currently used as the test framework.

The current test suite is headless and only testing the compiler and virtual machine.

## Backend

### Setup
You will need to install:
* [OpenJDK](https://openjdk.java.net/install/), Java 8 is the lowest possible target.
* [Maven](https://maven.apache.org/download.cgi), ensure it is in your `PATH` on the command line.
* [Docker](https://www.docker.com/products/docker-desktop), required to create a local database the easiest possible way.
* A Java IDE of your choice. I use Eclipse (fight me).

### Architecture
The Paperbots backend is contained in the [`server/`](server/) directory.

#### 3rd party dependencies
The backend uses [Javalin](https://javalin.io/) as the web framework of choice. It serves both the static frontend files in [`client/site`](client/site), as well as requests made by the frontend to create new users, login, save and load projects, etc.

Persistent data like users and projects are stored in a MySQL instance. The backend uses [JDBI](http://jdbi.org/) to talk to the database. For schema management and migration, the backend uses [Flyway](https://flywaydb.org/). The migration scripts are located in [`server/src/main/resources/db/migration/`](server/src/main/resources/db/migration/).

#### Business logic
The entire business logic of the Paperbots' backend is located in [Paperbots.java](server/src/main/java/io/paperbots/Paperbots.java).

#### Endpoints
All endpoints served by the server, as well as serving of static files is located in [Server.java](server/erver/src/main/java/io/paperbots/Server.java).


### Running the backend on the command line
Make sure Java, Maven and Docker are all available on the command line through the `PATH`.

As a first step, you want to start a local MySQL instance:

```
scripts/mysql-dev.sh
```

Next, you want to copy [`server/dev-config.json`](server/dev-config.json) to a new file, let's say `server/my-config.json`, and add your email address and password. The default assumes an email addressed managed by Gmail. If you use a different provider, modify the rest of the configuration accordingly. All this is required so you can sign-up and login with the locally running backend.

Next, build the server and start it:

```
cd server/
mvn clean package -Dmaven.test.skip=true -U
java -jar target/paperbots.jar -r -s ../client/site -c my-config.json
```

If everything went according to plan, you should now be able to visit [http://localhost:8001](http://localhost:8000) and see your local instance running.

### Running the backend from your IDE
Make sure Java, Maven and Docker are all available on the command line through the `PATH`.

As a first step, you want to start a local MySQL instance:

```
scripts/mysql-dev.sh
```

Next, you want to copy [`server/dev-config.json`](server/dev-config.json) to a new file, let's say `server/my-config.json`, and add your email address and password. The default assumes an email addressed managed by Gmail. If you use a different provider, modify the rest of the configuration accordingly. All this is required so you can sign-up and login with the locally running backend.

All that's left is setting up a launch configuration in your IDE. You want to run the `Paperbots` class, passing the following arguments (assuming the working directory is `server/`):

```
-r -s ../client/site -c my-config.json
```

If everything went according to plan, you should now be able to visit [http://localhost:8001](http://localhost:8000) and see your local instance running.

### Testing
All tests for the backend are contained in [`src/test/java/io/paperbots/`](src/test/java/io/paperbots/). You can either run them on the command line through Maven:

```
maven test
```

Or from the cosy confines of your IDE.

The unit tests use [testcontainers-java](https://github.com/testcontainers/testcontainers-java), which spawns MySQL Docker containers for all the tests. Make sure Docker is working on your machine.

### Deployment
See the [docker/README.md](docker/README.md)

# License
TBD

# Contributing
Follow the code style in the files of this repository. Add a test for your addition to the code, especially if it is for the compiler, virtual machine, or backend. Send a PR. Thanks!
