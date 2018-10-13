# Mario's Lab - Site
Source code for https://paperbots.io.

# Updating the content
There's a duct-tape script called `publish.sh` which:

1. Pushes local changes to the GitHub repository.
2. Calls the endpoint https://paperbots.io/api/reloadstatic, which makes the server pull the changes from GitHub and re-generate the static content.

# Updating the web server
There's a duct-tape script called `reload.sh` which:

1. Pushes local changes to the GitHub repository.
2. Calls the endpoint https://paperbots.io/api/reload, which makes the server pull the changes from GitHub and shuts down the server.
3. The `start.sh` script, with which the server was started, pulls in the latest changes from GitHub, recompiles the server, and re-starts it.

# Statistics
Install [goaccess](https://goaccess.io/) via the package manager. Then run the `stats.sh` file.

