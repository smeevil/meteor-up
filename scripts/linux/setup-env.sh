#!/bin/bash

sudo mkdir -p <%= deployPath %>/<%= appName %>/
sudo mkdir -p <%= deployPath %>/<%= appName %>/config
sudo mkdir -p <%= deployPath %>/<%= appName %>/tmp

sudo chown ${USER} <%= deployPath %>/<%= appName %> -R
sudo chown ${USER} /etc/init
sudo chown ${USER} /etc/

sudo npm install -g forever userdown wait-for-mongo node-gyp

# Creating a non-privileged user
sudo useradd meteoruser || :
