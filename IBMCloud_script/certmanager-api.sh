#!/bin/bash
####################################
# Description:
#   the script to interact with IBM Cloud cert-manager SaaS API.
#   upload and download certs for storing and syncing purpose.
#
#   Endpoints:
#     https://{region}.certificate-manager.cloud.ibm.com/api
#       {region}: us-south, us-east, eu-gb, eu-de. jp-tok and au-syd
#     LIST  : GET    /v3/{instance_id}/certificates
#     IMPORT: POST   /v3/{instance_id}/certificates/import
#     GET   : GET    /v2/certificate/{certificate_id}
#     DELETE: DELETE /v2/certificate/{certificate_id}
#     UPDATE: PUT    /v1/certificate/{certificate_id}
#
#   Documents:
#     https://cloud.ibm.com/apidocs/certificate-manager#introduction
#
# Environment:
#   operation Gateway servers:
#
# Author:
#   D.Sasaki(IBMj)
#
# History
#   2021/03/29: New created (D.Sasaki(IBMj))
#
####################################
set -e

###
# read common variables for
#   HTTPS_PROXY
#   API_KEY
###
COMMON_ENV='../lib/_common.env'


###
# local variables
###
REGION=jp-tok
EP=https://${REGION}.certificate-manager.cloud.ibm.com/api
RESOURCE_EP=https://resource-controller.cloud.ibm.com/v2/resource_instances
RC_OK=0
RC_NG=100
### the script root
#SCRIPT_ROOT=${SCRIPT_ROOT:-${HOME}/Istio/secret}
SCRIPT_ROOT=${SCRIPT_ROOT:-..}
LOG_DIR=${LOG_DIR:-${SCRIPT_ROOT}/log}
LOG=${LOG_DIR}/$(basename $0).$(date +%Y%m%d).log
RG=rg_dsp
CONTENT_KEY="content"
PRIV_KEY="priv_key"


# file out dir for download operation
DOWNLOAD_DIR=${DOWNLOAD_DIR:-${SCRIPT_ROOT}/dsp}
DOWNLOAD_FILE_PREFIX=${DOWNLOAD_FILE_PREFIX:-ca}

###
#alias
###
INVALID_ARG_NUM='fatal_logger invalid args count exception: function ${FUNCNAME[0]} required ${argn} args, but $# provided. exit'
AUTH_HEADER='-H "authorization: Bearer ${IAM_TOKEN}"'



###
# Functions
###

usage() {
  printf "
\tusage of this script:
\t\t$0 <operation> <instanceName or certCRN> [<nameSpace> [<cetFilePath> <keyFilePath>]]
\t\toperations:
\t\t\tlist [-v|--verbose] <instanceName>
\t\t\tupload <instanceName> <nameSpace> <cetFilePath> <keyFilePath>
\t\t\tdownload <certCRN> <nameSpace>
\t\t\tdelete <certCRN>

\t\targuments:
\t\t\t<operations>: list, upload, download, or delete.
\t\t\t<instanceName>: humanreadable name displayed on Cloud console(ex: cm-dsp-dt-01)
\t\t\t<certCRN>: CRN-based instanceId (ex: crn:v1:bluemix:public:cloudcerts:jp-tok:.........)
\t\t\t<nameSpace>: customer indetifier, mostly same as kubernetes(openshift) Namespace
\t\t\t<cetFilePath>: pem formated cert file to upload
\t\t\t<keyFilePath>: pem formated key file paired with certFilePath specified

\t\tENVIRONMENT VARIABLE:
\t\t\tSCRIPT_ROOT: root directory for this script (log or download dir base in default). if doesn't exist, this script will exit immediatelly(now: ${SCRIPT_ROOT})
\t\t\tLOG_DIR: the directory to output logs. if doesn't exist, then created recursively(now: ${LOG_DIR})
\t\t\tDOWNLOAD_DIR: the directory to downloaded files. if doesn't exist, then created recursively(now: ${DOWNLOAD_DIR})
\t\t\tDOWNLOAD_FILE_PREFIX: the prefix of downloaded files. the outputted files will be named as xxx.crt(certificate) and xxx.key(key)(now: ${DOWNLOAD_FILE_PREFIX})
" >&2
}

#
# usage:
#   args:
#     *
#   return (code):
#     0: normal end
#     100: some handled error
#
logger() {
  echo -e "$(date): [INFO]\t$@\n" | tee -a ${LOG}
  return ${RC_OK}
}

error_logger() {
  echo -e "$(date): [ERROR]\t$@\n" | tee -a ${LOG} >&2
  return ${RC_NG}
}

fatal_logger() {
  echo -e "$(date): [FATAL]\t$@\n" | tee -a ${LOG} >&2
  usage
  exit ${RC_NG}
}

# description:
#   common logic to check args counts as expected
#
# usage:
#   args:
#     $1: args count
#     $2: disirable args count separated by ',' (evaluated for OR condition)
#   return (code):
#     0: normal end
#     100: some handled error
#     
eval_argn() {
  local argn=$1;shift 1
  local IFS=','
  local RC=${RC_NG}
  for a in $@; do [ ${argn} -eq $a ] && RC=${RC_OK};done
  return $RC
}


#
# usage:
#   args:
#     $*: strings to encode
#   return ():
#     url-encoded string
url_encode() {
  local inn=$@
  local out=""
  for ((i=0;i<${#inn};i++));do
    c=${inn:$i:1}
    case $c in
      [-_.~a-zA-Z0-9]) out+=$c;;
      *)out+=$(printf '%%%02X' "'$c");;
    esac
  done
  echo $out
}


# description
#   API docs: https://cloud.ibm.com/apidocs/resource-controller/resource-controller#intro
# usage:
#  args:
#    $1: instance displayed name
#  return (output):
#    CRN based instance ID
#
name2id() {
  argn=1
  eval_argn $# ${argn} || eval ${INVALID_ARG_NUM}
  local instance=$1
  local cURL="${AUTH_HEADER} -X GET '${RESOURCE_EP}?name=${instance}'"
  local ID=$(query -e ${cURL} | jq -r '.resources[] | select(.name == "'${instance}'") | .crn')
  [ -z ${ID} ] && fatal_logger "the instance ${instance} not found, exit"
  url_encode ${ID}
  return 0
}

# usage:
#   args:
#     $1: * or curl query   -e:echo back the response  -v:write the response to log
#   return (code):
#     0: normal end
#     100: some handled error
#     
query() {
  local ECHO=1
  local LOGGER=1
  local JSON=1
  local VJSON=1
  case $1 in
    -e) ECHO=0;shift 1 ;;
    -v) LOGGER=0;shift 1;;
    -j) JSON=0;shift 1;;
    -jv) VJSON=0;shift 1;;
  esac
  local cURL="curl -s -w' %{http_code}' "$@
  local responsebody=$(eval ${cURL});RC=$?
  local response=$(echo ${responsebody}| awk 'END{print $NF}')
  local responsebody=$(echo ${responsebody%${response}} | grep -Eo '\{.*\}')
  if [ ${RC} -ne ${RC_OK} ]; then
    error_logger "invoking API failed. failed command is '${cURL}'"
  elif ! expr ${response} : 2.. >/dev/null;then
    error_logger "invalid response ${response} from API endpoint. failed command is '${cURL}' and the response is '${responsebody}'"
  else
    [ ${ECHO} -eq 0 ] && echo "${responsebody}"
    [ ${LOGGER} -eq 0 ] && logger "query successed. result is \n${responsebody})"
    [ ${JSON} -eq 0 ] && echo "${responsebody}"|jq -r '.certificates[] | {name: .name,  _id: ._id}'
    [ ${VJSON} -eq 0 ] && echo "${responsebody}"|jq
    return $RC
  fi
}


#
# usage:
#   args:
#     $1: operation: 'upload', 'download', 'delete', or 'list'
#     $2: instance name of cert-manager
#     $3: pem formated cert file path
#     $4: pem formated key file path
#   return:
#     void
#
certs_api() {
  local v=""
  local ope=$1
  # add verbose option if specified
  case $2 in -v|--verbose) v=v;shift;;esac
  local instance=$2
  local ns=$3
  local cert=$4
  local key=$5
  local q_opt="-v"
  case ${ope} in
    list)
      argn=2
      eval_argn $# ${argn} || eval ${INVALID_ARG_NUM}
      instance_id=$(name2id ${instance})
      api_ope=GET
      ep="/v3/${instance_id}/certificates"
      opt=""
      q_opt="-j"$v
    ;;
    upload) 
      argn=5
      eval_argn $# ${argn} || eval ${INVALID_ARG_NUM}
      instance_id=$(name2id ${instance})
      api_ope=POST
      ep="/v3/${instance_id}/certificates/import"
      local upload_data='{ "name": "'${ns}'", "description":"CA file for customer '${ns}'", "data": {"'${CONTENT_KEY}'":"'$(awk '{a=a$0"\\n"}END{print a}' ${cert})'", "'${PRIV_KEY}'":"'$(awk '{a=a$0"\\n"}END{print a}' ${key})'"}}'
      opt="-H 'Content-Type: application/json' -d '${upload_data}'"
    ;;
    download)
      argn=3
      eval_argn $# ${argn} || eval ${INVALID_ARG_NUM}
      api_ope=GET
      certificate_id=$(url_encode ${instance})
      ep="/v2/certificate/${certificate_id}"
      q_opt="-e"
    ;;
    delete)
      argn=2
      eval_argn $# ${argn} || eval ${INVALID_ARG_NUM}
      api_ope=DELETE
      certificate_id=$(url_encode ${instance})
      ep="/v2/certificate/${certificate_id}"
    ;;
    *) fatal_logger "invalid operation('${ope}') passed, exit"
    ;;
  esac
  cURL="-X${api_ope} ${AUTH_HEADER} ${opt} '${EP}${ep}'"
  case ${ope} in
    download) 
      res=$(query ${q_opt} ${cURL})
      odir=${DOWNLOAD_DIR%/}/${ns%/}
      [ ! -d ${odir} ] && mkdir -p ${odir}
      echo $res | jq -r '.data.'${CONTENT_KEY} > ${odir}/${DOWNLOAD_FILE_PREFIX}.crt
      [ $? -ne 0 ] && fatal_logger "failed to write out into '${odir}', exit"
      echo $res | jq -r '.data.'${PRIV_KEY} > ${odir}/${DOWNLOAD_FILE_PREFIX}.key
      [ $? -ne 0 ] && fatal_logger "failed to write out into '${odir}', exit"
      logger "cert and key files outputted in '${odir}'"
    ;;
    *) query ${q_opt} ${cURL}
    ;;
  esac
  return $?
}



#########
# main
#########

for a in $@;do
  case $a in
    -h|--help) usage;exit 0;;
  esac
done
###
# make log file
###
[ ! -d ${SCRIPT_ROOT} ] && fatal_logger "script root '${SCRIPT_ROOT}' doesn't exist, create it at first. exit"
logdir=$(dirname ${LOG})
[ ! -d ${logdir} ] && mkdir -p ${logdir} && touch ${LOG} && logger "log file initialized"

###
# read common variables
###
[ -r ${COMMON_ENV} ] || fatal_logger "env file ${COMMON_ENV} not found, exit"
. ${COMMON_ENV}

HTTP_PROXY=${HTTPS_PROXY}
###
# get an access token
###
#
IAM_TOKEN='<...>'

###
certs_api $@
