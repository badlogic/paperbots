#!/bin/sh
git commit -am "New site changes."
set -e
git push
curl -X POST -F "password=$PAPERBOTS_RELOAD_PWD" https://paperbots.io/api/reloadstatic
