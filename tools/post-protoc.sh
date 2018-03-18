#!/usr/bin/env bash
set -u

readonly SCRIPT_DIR_PATH=$(dirname $0)
sed -i '' -e 's/google-protobuf/\.\.\/types\/google-protobuf/g' ${SCRIPT_DIR_PATH}/../src/proto/*
