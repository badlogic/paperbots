#!/bin/sh
git commit -am "New site changes (post, project, music)."
set -e
git push
curl -X POST -F "password=$PAPERBOTS_PWD" https://paperbots.io/api/reload
