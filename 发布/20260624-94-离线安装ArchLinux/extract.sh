#!/usr/bin/env bash
cat local-arch-repo.tar.* | tar -C /tmp/repo -xvf -

cd /tmp/repo/repo && cp sync/* pkg
