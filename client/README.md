# Paperbots digital
This is the digital version of Paperbots, to be run in a browser. It consists of a compiler, interpreter and debugger, and a playground to execute paperbot scripts.

## Development
Install Node and NPM. Then in the `lang` dir:

1. `npm install`, to pull down the dependencies into `lang/node_modules/`.
2. `npm start dev`, to start a server on port 8000, a file watcher to recompile `src/grammar.pegjs` to `src/Parser.ts` on changes, and `tsc` in watch mode to compile the files in `src/` to a single file in `js/paperbots-lang.js`.

If you change any source file, incremental compilation is triggered by the programs in step 2, and your browser gets refreshed automatically.

To just build the output `.js` run `npm run build`.

Since everything in web development must be terrible, Paperbots digital requires `require.js` to load its JS in the browser. The `js/` directory already contains this dependency, and the `index.html` file demonstrate the magic incantations to get things loaded.