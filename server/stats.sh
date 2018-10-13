#!/bin/sh
set -e
scp paperbots.io:/home/badlogic/paperbots.io/data/logs/access.log access.log
goaccess -f access.log -o report.html --log-format=COMBINED
rm access.log
open report.html