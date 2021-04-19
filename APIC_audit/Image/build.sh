#!/bin/sh
usage() {
  printf "usage: $0 <p|d> <version>
 \t<p|d>: prod or dev
 \t<version>: image tag\n" 1>&2
}
[ $# -ne 2 ] && { usage && exit 1;}

REPO="<...>"
IMAGE="${REPO}/dumper:${2}"
docker build -t ${IMAGE} . \
&& printf "\npush command:\n\tdocker push ${IMAGE}\nlogin: docker login -u iamapikey ${REPO}\n\n"

