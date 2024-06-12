#!/bin/bash

trap 'kill $(jobs -p)' EXIT; until node index.js & wait; do
    echo "Game Server crashed $?. Respawning.." >&2
    sleep 1
done
