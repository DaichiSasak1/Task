#!/bin/bash
#
#for test-automation and report all oauth requests and  from client and API Connect
#
# used with stub-http server(written by python)
#
###########
# variables
###########
declare -a REQUIRED
REQUIRED[0]=RGW             # IDG(rgw) host name
REQUIRED[1]=CATALOG_BASE_PATH # the base path for the target catalog test /dsp-admin-test/sandbox
REQUIRED[2]=OAUTH_BASE_PATH # the base path for ouah provider to test (/dsp-admin-test/sandbox)/test
REQUIRED[3]=SCOPE
REQUIRED[4]=CLIENT_ID
REQUIRED[5]=CLIENT_SECRET
REQUIRED[6]=USERNAME        # resource owner
REQUIRED[7]=PASSWORD        # used for resource owner credencials flow
REQUIRED[8]=STUB_URL        # stub server defined as revocation endpoint (just used to mark current flow)

CONF="./conf"
[ -r ${CONF} ] && . ${CONF}

# set default variables
: ${REDIRECT_URI:=https://example.com}
: ${STATE:=321abc}
: ${NONCE:=124cba}
# log file for the client recived respons
: ${LOG:=/tmp/responses.$(date +%Y%m%d%H%M%S).log}

###########
# constants (default value for API Connect)
###########
: ${AUTH_PATH:=/oauth2/authorize}
: ${TOKEN_PATH:=/oauth2/token}
: ${INTROSPECT_PATH:=/oauth2/introspect}
: ${APICALL_PATH}
: ${NS:=stub-http}
: ${APP:=stub-http}


###########
# switch Do or No(Default to No)
#   0: Do
#   1: No
###########
### Flows
: ${IMPLICIT:=1}
: ${CLIENT_CREDENTIALS:=1}
: ${RESOURCE_OWNER_PASSWORD_CREDENTIALS:=1}
: ${AUTHORIZATION_CODE:=1}
: ${JWT:=1}
: ${OIDC:=1}
### Mode
: ${DRY_RUN:=1}

# constant query keys
q_RES="response_type="
q_GRT="grant_type="
q_SCOPE="scope="
q_TOKEN="token="
q_ASSERTION="assertion="
q_CODE="code="
q_REFRESH_TOKEN="refresh_token="
q_CODE_VERIFIER="code_verifier="
q_CODE_CHALLENGE="code_challenge="
q_CODE_CHALLENGE_METHOD="code_challenge_method="
q_TOKEN_TYPE_HINT="token_type_hint="

Q_CLIENT_ID="client_id=${CLIENT_ID}"
Q_USERNAME="username=${USERNAME}"
Q_PASSWORD="password=${PASSWORD}"
Q_STATE="state=${STATE}"
Q_NONCE="nonce=${NONCE}"
Q_REDIRECT_URI="redirect_uri=${REDIRECT_URI}"

# constant query values
RES_TOKEN="token"
RES_CLIENT=""
RES_PASSWORD=""
RES_CODE="code"
RES_JWT=""
RES_IDTOKEN="id_token"
RES_REFRESH=""

GRT_TOKEN=""
GRT_CLIENT="client_credentials"
GRT_PASSWORD="password"
GRT_CODE="authorization_code"
GRT_JWT="urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer"
GRT_IDTOKEN=""
GRT_REFRESH="refresh_token"

# constant keys
ACCESS_TOKEN="access_token"
ID_TOKEN="id_token"
REFRESH_TOKEN="refresh_token"
CODE="code"
NULL="null"

# common return command
RETURN_TOKENS='echo ${token[*]:-${NULL}} ${refresh_token[*]:-${NULL}} ${id_token[*]:-${NULL}}'


# check if required variable are provided
for r in ${REQUIRED[@]};do
  [ -z $(eval "echo \$$r") ] && echo "Required variable '$r' doesn't provided. exit" >&2 && exit 1
done


# define common headers for requests
HEADER[0]="-H 'x-ibm-client-id: ${CLIENT_ID}'"
HEADER[1]="-H 'x-ibm-client-secret: ${CLIENT_SECRET}'"


# define the base path
URL_BASE=${RGW%/}/${CATALOG_BASE_PATH#/}
OAUTH_BASE=${URL_BASE%/}/${OAUTH_BASE_PATH#/}


logger(){
  echo -e "$(date): [INFO]\t$@\n" | tee -a ${LOG} >&2
}
loggerf(){
  echo -e "$(date): [INFO]\t$@\n" >> ${LOG}
  #echo -e "$(date): [INFO]\t$@\n" | tee -a ${LOG} >&2
}

joinq() {
  # set IFS for joining character(default to a space
  case $1 in -d) local IFS=$2;shift 2;;esac
  echo "$*"
}

query_get() { # stdin=query key
  awk '{if(/'$1'/) print gensub(/.*'$1='([^&]+).*/,"\\1",1)}'
}

trim_jwt_body() {
   # $1: a JWT
   if [ $1 != ${NULL} -a ! -z $1 ];then
     echo $1 |awk '{print gensub(/.*\.(.*)\..*/,"\\1","g")}' | base64 -d 2>/dev/null
   else
     echo $1
   fi
}

jwt_entry() {
  # $1: key for this entry
  # $[2:]: contens for this entry
  local key=$1
  shift 1
  local o="\"${key}\":["
  for e in "$@";do
    o+="{\"original\":\"${e}\",\"content\":$(trim_jwt_body $e)},"
  done
  echo "${o%,}]"
}

json_entry() {
  local key=$1
  shift 1
  local o="\"${key}\":["
  for e in "$@";do
    o+="$e,"
  done
  echo "${o%,}]"
}

retrieve_redirect_uri() {
  #sed -n '/^[><] [lL][oO][cC][aA][tT][iI][oO][nN]: ${REDIRECT_URI////\\/}/p'
  #sed -e 's/[^[:print:]]\[[0-9;]\+m//g' -n '/^[><] [lL][oO][cC][aA][tT][iI][oO][nN]: ${REDIRECT_URI////\\/}/p'
  sed -n '/^[><] [lL][oO][cC][aA][tT][iI][oO][nN]: '${REDIRECT_URI////\\/}'/p' | sed 's/[^[:print:]]//g' 
}

mark_req(){
  # $1: current flow type to mark
  curl -ks -H "MARKER: ${1}" "${STUB_URL}" >/dev/null
}

mark(){
  #flow type to mark, one of AUTH, GRT, or API
  local marker="${TYPE}-${1},${res_type},${grt_type}"
  mark_req "${marker}"
  loggerf "${marker}"
}

request(){
  sleep 1
  local req="$*"
  loggerf "Request:: ${req}"
  [ ${DRY_RUN} -eq 0 ] && req='echo Dry-run mode'
  local res=$(eval "${req}")
  loggerf "Response:: ${res}"
  echo ${res}
  return 0
}

implicit() {
  # $1: scope: <scope>, openid
  #return:
  # $1: access token
  # $2: refresh token
  # $3: id token
  local scope=${q_SCOPE}${1}
  local TYPE
  case ${1} in openid)TYPE=IDTOKEN;; *)TYPE=TOKEN;;esac
  local res_type=$(eval echo ${q_RES}\${RES_${TYPE}})
  local grt_type=$(eval echo ${q_GRT}\${GRT_${TYPE}})
  local query="${OAUTH_BASE%/}/${AUTH_PATH}?$(joinq -d '&' ${scope} ${res_type} ${Q_CLIENT_ID} ${Q_NONCE} ${Q_STATE} ${Q_REDIRECT_URI})"
  mark AUTH
  #local req="curl -kLsv '${query}' 2>&1 | egrep \"^[<>] Location: ${REDIRECT_URI}\""
  local req="curl -kLsv '${query}' 2>&1 | retrieve_redirect_uri"
  local token_res="$(request ${req})"
  local token=$(echo ${token_res} | query_get ${ACCESS_TOKEN})
  local id_token=$(echo ${token_res} | query_get ${ID_TOKEN})
  local refresh_token=$(echo ${token_res} | query_get ${REFRESH_TOKEN})
  eval "${RETURN_TOKENS}"
  return 0
}

client_credentials() {
  #return:
  # $1: access token
  # $2: refresh token
  # $3: id token
  local scope=${q_SCOPE}${SCOPE}
  local TYPE=CLIENT
  local res_type=$(eval echo ${q_RES}\${RES_${TYPE}})
  local grt_type=$(eval echo ${q_GRT}\${GRT_${TYPE}})
  local query=${OAUTH_BASE%/}/${TOKEN_PATH#/}
  mark GRT
  req="curl -ks ${HEADER[@]} -XPOST  ${query} -d'$(joinq -d '&' ${grt_type} ${scope} ${Q_REDIRECT_URI})'"
  local token_res="$(request ${req})"
  local token=$(echo ${token_res} | jq -r ".${ACCESS_TOKEN}")
  local id_token=$(echo ${token_res} | jq -r ".${ID_TOKEN}")
  local refresh_token=$(echo ${token_res} | jq -r ".${REFRESH_TOKEN}")
  eval "${RETURN_TOKENS}"
  return 0
}

resource_owner() {
  #return:
  # $1: access token
  # $2: refresh token
  # $3: id token
  local scope=${q_SCOPE}${SCOPE}
  local TYPE=PASSWORD
  local res_type=$(eval echo ${q_RES}\${RES_${TYPE}})
  local grt_type=$(eval echo ${q_GRT}\${GRT_${TYPE}})
  local query=${OAUTH_BASE%/}/${TOKEN_PATH#/}
  local req="curl -ks ${HEADER[@]} -XPOST  ${query} -d'$(joinq -d '&' ${grt_type} ${scope} ${Q_USERNAME} ${Q_PASSWORD} ${Q_REDIRECT_URI})'"
  mark GRT
  local token_res="$(request ${req})"
  local token=$(echo ${token_res} | jq -r ".${ACCESS_TOKEN}")
  local id_token=$(echo ${token_res} | jq -r ".${ID_TOKEN}")
  local refresh_token=$(echo ${token_res} | jq -r ".${REFRESH_TOKEN}")
  eval "${RETURN_TOKENS}"
  return 0
}


client_credencials() {
  #return:
  # $1: access token
  # $2: refresh token
  # $3: id token
  local scope=${q_SCOPE}${SCOPE}
  local TYPE=CLIENT
  local res_type=$(eval echo ${q_RES}\${RES_${TYPE}})
  local grt_type=$(eval echo ${q_GRT}\${GRT_${TYPE}})
  local query=${OAUTH_BASE%/}/${TOKEN_PATH#/}
  mark GRT
  req="curl -ks ${HEADER[@]} -XPOST  ${query} -d'$(joinq -d '&' ${grt_type} ${scope} ${Q_REDIRECT_URI})'"
  local token_res="$(request ${req})"
  local token=$(echo ${token_res} | jq -r ".${ACCESS_TOKEN}")
  local id_token=$(echo ${token_res} | jq -r ".${ID_TOKEN}")
  local refresh_token=$(echo ${token_res} | jq -r ".${REFRESH_TOKEN}")
  eval "${RETURN_TOKENS}"
  return 0
}

resource_owner() {
  #return:
  # $1: access token
  # $2: refresh token
  # $3: id token
  local scope=${q_SCOPE}${SCOPE}
  local TYPE=PASSWORD
  local res_type=$(eval echo ${q_RES}\${RES_${TYPE}})
  local grt_type=$(eval echo ${q_GRT}\${GRT_${TYPE}})
  local query=${OAUTH_BASE%/}/${TOKEN_PATH#/}
  local req="curl -ks ${HEADER[@]} -XPOST  ${query} -d'$(joinq -d '&' ${grt_type} ${scope} ${Q_USERNAME} ${Q_PASSWORD} ${Q_REDIRECT_URI})'"
  mark GRT
  local token_res="$(request ${req})"
  local token=$(echo ${token_res} | jq -r ".${ACCESS_TOKEN}")
  local id_token=$(echo ${token_res} | jq -r ".${ID_TOKEN}")
  local refresh_token=$(echo ${token_res} | jq -r ".${REFRESH_TOKEN}")
  eval "${RETURN_TOKENS}"
  return 0
}

authorization_code() {
  #return:
  # $1: access token
  # $2: refresh token
  # $3: id token
  local scope=${q_SCOPE}${1}
  local TYPE=CODE
  local res_type=$(eval echo ${q_RES}\${RES_${TYPE}})
  local grt_type=$(eval echo ${q_GRT}\${GRT_${TYPE}})
  # authorization
  local query=${OAUTH_BASE%/}/${AUTH_PATH#/}?$(joinq -d '&' ${scope} ${res_type} ${Q_CLIENT_ID} ${Q_NONCE} ${Q_STATE} ${Q_REDIRECT_URI})
  #local req="curl -kLsv ${query} 2>&1 | egrep \"^[<>] 
  local req="curl -kLsv '${query}' 2>&1 | retrieve_redirect_uri"
  mark AUTH
  local auth_res=$(request "${req}")
  local code=$(echo ${auth_res} | query_get ${CODE})
  # token
  [ -z ${code} ] && logger "no code provided. return 1" && return 1
  code=${q_CODE}${code}
  query=${OAUTH_BASE%/}/${TOKEN_PATH#/}
  req="curl -ks ${HEADER[@]} -XPOST  ${query} -d \"$(joinq -d '&' ${grt_type} ${code} ${Q_REDIRECT_URI})\""
  mark GRT
  local token_res=$(request "${req}")
  local token=$(echo ${token_res} | jq -r ".${ACCESS_TOKEN}")
  local id_token=$(echo ${token_res} | jq -r ".${ID_TOKEN}")
  local refresh_token=$(echo ${token_res} | jq -r ".${REFRESH_TOKEN}")
  eval "${RETURN_TOKENS}"
  return 0
}

jwt() {
  # $1: assertion (id_token)
  #return:
  # $1: access token
  # $2: refresh token
  # $3: id token
  local assertion=${q_ASSERTION}${1}
  local scope=${q_SCOPE}${SCOPE}
  local TYPE=JWT
  local res_type=$(eval echo ${q_RES}\${RES_${TYPE}})
  local grt_type=$(eval echo ${q_GRT}\${GRT_${TYPE}})
  local query=${OAUTH_BASE%/}/${TOKEN_PATH#/}
  local req="curl -ks ${HEADER[@]} -XPOST  ${query} -d'$(joinq -d '&' ${grt_type} ${scope} ${assertion} ${Q_REDIRECT_URI})'"
  mark GRT
  local token_res="$(request ${req})"
  local token=$(echo ${token_res} | jq -r ".${ACCESS_TOKEN}")
  local id_token=$(echo ${token_res} | jq -r ".${ID_TOKEN}")
  local refresh_token=$(echo ${token_res} | jq -r ".${REFRESH_TOKEN}")
  eval "${RETURN_TOKENS}"
  return 0
}

refresh_token() {
  #return:
  # $1: access token
  # $2: refresh token
  # $3: id token
  local token=${q_REFRESH_TOKEN}${1}
  local TYPE=REFRESH
  local res_type=$(eval echo ${q_RES}\${RES_${TYPE}})
  local grt_type=$(eval echo ${q_GRT}\${GRT_${TYPE}})
  local query=${OAUTH_BASE%/}/${TOKEN_PATH#/}
  local req="curl -ks ${HEADER[@]} -XPOST  ${query} -d'$(joinq -d '&' ${grt_type} ${token})'"
  mark GRT
  local token_res="$(request ${req})"
  local token=$(echo ${token_res} | jq -r ".${ACCESS_TOKEN}")
  local id_token=$(echo ${token_res} | jq -r ".${ID_TOKEN}")
  local refresh_token=$(echo ${token_res} | jq -r ".${REFRESH_TOKEN}")
  eval "${RETURN_TOKENS}"
  return 0
}

introspect() {
  # $1: token
  # $2: token type hint: access token or refresh token
  #return:
  # $1: introspect result
  local token=$1
  [[ $# < 2 || ${token} == ${NULL} ]] && logger "no token provided, skip introspection call" && return 1
  token=${q_TOKEN}${token}
  local token_type=${q_TOKEN_TYPE_HINT}${2}
  local query=${OAUTH_BASE%/}/${INTROSPECT_PATH#/}
  local req="curl -ks ${HEADER[@]} -XPOST '${query}' -d'$(joinq -d '&' ${token} ${token_type})'"
  mark GRT
  request ${req}
}

pkce() {
  # $1 scope
  # $2 method ("plain" or "sha256")
  #return:
  # $1: access token
  # $2: refresh token
  # $3: id token
  local scope=${q_SCOPE}${1}
  local method=${2}
  local verifier=$(cat /dev/urandom | base64 -w0 |fold -w 43 | head -n1 | tr '/+' '-_')
  local challenge=${verifier}
  case ${method} in sha256)challenge=$(echo -n ${challenge} | shasum -a 256 | cut -d " " -f 1 | xxd -r -p | base64 | tr / _ | tr + - | cut -d= -f1);verifier=${challenge};;esac
  verifier=${q_CODE_VERIFIER}${verifier}
  method=${q_CODE_CHALLENGE_METHOD}${method}
  challenge=${q_CODE_CHALLENGE}${challenge}
  local TYPE=CODE
  local res_type=$(eval echo ${q_RES}\${RES_${TYPE}})
  local grt_type=$(eval echo ${q_GRT}\${GRT_${TYPE}})
  # authorization
  local query=${OAUTH_BASE%/}/${AUTH_PATH#/}?$(joinq -d '&' ${scope} ${res_type} ${Q_CLIENT_ID} ${Q_NONCE} ${Q_STATE} ${Q_REDIRECT_URI} ${method} ${challenge})
  #local req="curl -kLsv ${query} 2>&1 | egrep \"^[<>] Location: ${REDIRECT_URI}\""
  local req="curl -kLsv '${query}' 2>&1 | retrieve_redirect_uri"
  mark AUTH
  local auth_res=$(request "${req}")
  local code=$(echo ${auth_res} | query_get ${CODE})
  # token
  [ -z ${code} ] && logger "no code provided. return 1" && return 1
  code=${q_CODE}${code}
  query=${OAUTH_BASE%/}/${TOKEN_PATH#/}
  req="curl -ks ${HEADER[@]} -XPOST  ${query} -d'$(joinq -d '&' ${grt_type} ${code} ${Q_REDIRECT_URI} ${verifier})'"
  mark GRT
  local token_res=$(request "${req}")
  local token=$(echo ${token_res} | jq -r ".${ACCESS_TOKEN}")
  local id_token=$(echo ${token_res} | jq -r ".${ID_TOKEN}")
  local refresh_token=$(echo ${token_res} | jq -r ".${REFRESH_TOKEN}")
  eval "${RETURN_TOKENS}"
  return 0
}

hybrid() {
  # $*: response_type  :token, id_token, code. pass like token+code
  #return:
  # $1: access token
  # $2: refresh token
  # $3: id token 1 (implicit context)
  # $4: id token 2 (authorization code context)
  local scope=${q_SCOPE}"openid"
  local TYPE=CODE
  local res_type=${q_RES}$(joinq -d '+' ${@})
  local grt_type=${q_GRT}${GRT_CODE}
  # authorization
  local query=${OAUTH_BASE%/}/${AUTH_PATH#/}?$(joinq -d '&' ${scope} ${res_type} ${Q_CLIENT_ID} ${Q_NONCE} ${Q_STATE} ${Q_REDIRECT_URI})
  #local req="curl -kLsv ${query} 2>&1 | egrep \"^[<>] Location: ${REDIRECT_URI}\""
  local req="curl -kLsv '${query}' 2>&1 | retrieve_redirect_uri"
  mark AUTH
  local auth_res=$(request "${req}")
  local code=$(echo ${auth_res} | query_get ${CODE})
  #local id_tokent[0]=$(echo ${auth_res} | query_get ${ID_TOKEN})
  local id_token[0]=$(echo ${auth_res} | query_get ${ID_TOKEN})
  # token
  [ ! -z ${code} ] && {
    code=${q_CODE}${code}
    query=${OAUTH_BASE%/}/${TOKEN_PATH#/}
    req="curl -ks ${HEADER[@]} -XPOST  ${query} -d \"$(joinq -d '&' ${grt_type} ${code} ${Q_REDIRECT_URI})\""
    mark GRT
    local token_res=$(request "${req}")
    local token=$(echo ${token_res} | jq -r ".${ACCESS_TOKEN}")
    id_token[1]=$(echo ${token_res} | jq -r ".${ID_TOKEN}")
    local refresh_token=$(echo ${token_res} | jq -r ".${REFRESH_TOKEN}")
  }
  eval "${RETURN_TOKENS}"
  return 0
}

apicall() {
  local token=$1
  [[ $# < 1 || ${token} == ${NULL} ]] && logger "no token provided, skip api call" && return 1
  [ -z ${APICALL_PATH} ] && logger "no api call endpoint 'APICALL_PATH' provided, skip api call" && return 1
  # $1: token
  local query=${URL_BASE%/}/${APICALL_PATH#/}
  local AUTH_HEADER="-H 'Authorization: Bearer ${token}'"
  local req="curl -ks ${AUTH_HEADER} -XGET '${query}'"
  mark API
  request ${req}
}

main() {
  local tokens # $1:access_token  $2:id_token  $3:refresh_token
  local id_tokens=()  # store id_tokens to analyze
  local idt_i=0
  local introspections=()  # store introspection response to analize
  local int_i=0
  #local log_suffix="$(date +%Y%m%d%H%M%S).log"
  local logdir=$(dirname ${LOG})
  local log_suffix="$(date +%Y%m%d).log"
  #local li=0
  #local logs="${logdir}/*${log_suffix}"

  local stub_pod=$(kubectl get po -n ${NS} -l app=${APP} --template='{{index .items 0 "metadata" "name"}}')
  if [ ! -z ${stub_pod} ];then {
    local stub_log=${logdir}/${stub_pod}.${log_suffix}
    kubectl logs -n ${NS} -f --tail=0 ${stub_pod} >> ${stub_log} &
    local pn=$! 
    echo "start logging stub pod, wait for log process to receive marker request"; sleep 3
  } else {
    echo "cannot connect cluster, pod log couldn't record. continue." >&2
  }
  fi
  local id_token_log=${logdir}/id_token.${log_suffix}
  local introspection_log=${logdir}/introspection.${log_suffix}

### BEGINING
mark_req "BEGINNING"

  ### Implicit flow
  #  implicit ${SCOPE}
  [ ${IMPLICIT} -eq 0 ] && {
    tokens=($(implicit ${SCOPE}))
    apicall ${tokens[0]}
    introspections[$((int_i++))]+=$(json_entry implicit_access_token $(introspect ${tokens[0]} access_token))
  }

  ### client credentials
  #client_credentials
  [ ${CLIENT_CREDENTIALS} -eq 0 ] && {
    tokens=($(client_credentials))
    apicall ${tokens[0]}
    introspections[$((int_i++))]+=$(json_entry client_credentials_access_token $(introspect ${tokens[0]} access_token))
  }


  ### resource owner credentials
  [ ${RESOURCE_OWNER_PASSWORD_CREDENTIALS} -eq 0 ] && {
    tokens=($(resource_owner))
    apicall ${tokens[0]}
    introspections[$((int_i++))]+=$(json_entry resource_owner_access_token $(introspect ${tokens[0]} access_token))
    introspections[$((int_i++))]+=$(json_entry resource_owner_refresh_token $(introspect ${tokens[1]} refresh_token))
  }

  ### authorization code
  #  authorization_code ${SCOPE}
  [ ${AUTHORIZATION_CODE} -eq 0 ] && {
    tokens=($(authorization_code ${SCOPE}))
    apicall ${tokens[0]}
    introspections[$((int_i++))]+=$(json_entry authorization_code_access_token $(introspect ${tokens[0]} access_token))
    introspections[$((int_i++))]+=$(json_entry authorization_code_refresh_token $(introspect ${tokens[1]} refresh_token))
    #pkce ${SCOPE} plain
    #pkce ${SCOPE} sha256
  }


  ### JWT
  #  jwt ${id_token}
  [ ${JWT} -eq 0 ] && {
    tokens=($(hybrid id_token))
    tokens=($(jwt ${tokens[2]}))
    apicall ${tokens[0]}
    introspections[$((int_i++))]+=$(json_entry JWT $(introspect ${tokens[0]} access_token))
  }

#### OIDC
mark_req "OIDC"

  [ ${OIDC} -eq 0 ] && {
    for rt in id_token code id_token+token id_token+code token+code id_token+token+code;do
      tokens=($(hybrid ${rt}))
      id_tokens[$((idt_i++))]+="$(jwt_entry ${rt} ${tokens[2]} ${tokens[3]})"
      sleep 1
    done
  }
  #tokens=($(hybrid code+id_token))
  #id_tokens[$((idt_i++))]+="$(jwt_entry code+id_token ${tokens[2]} ${tokens[3]})"

### END
mark_req "END"
  echo "end logging stub pod, wait for log process to receive mark request"; sleep 3
  [ ! -z ${pn} ] && kill ${pn} && echo "pod logging process '${pn}' killed"
  [ ${#id_tokens} -gt 0 ] && {
    echo "retrieved id_tokens are below"
    id_tokens="{$(joinq -d ',' ${id_tokens[@]})}"
    echo ${id_tokens} | tee ${id_token_log}
  }
  [ ${#introspections} -gt 0 ] && {
    echo "introspections are below"
    introspections="{$(joinq -d ',' ${introspections[@]})}"
    echo ${introspections} | tee ${introspection_log}
  }
}

main
