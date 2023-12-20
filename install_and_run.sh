#!/bin/bash
echo -e "\e[1;34m-- INSTALLING --\e[0m"
npm install
npm install -g @ionic/cli
echo -e "\e[1;34m-- BUILDING --\e[0m"
ionic build
echo -e "\e[1;32m-- STARTING --\e[0m"
ionic serve --host 0.0.0.0 --port 8100 --lab