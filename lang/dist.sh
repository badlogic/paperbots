#!/bin/sh
rm -rf dist
set -e
mkdir dist
mkdir dist/js
mkdir dist/css
mkdir dist/img

cp index.html dist
cp js/* dist/js/
cp css/* dist/css/
cp img/* dist/img/