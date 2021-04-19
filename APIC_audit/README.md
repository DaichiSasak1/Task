# bsc-api-auditdumper
dumper deployment for IBM API Connect audit log.  
the log POSTeds to any specified Endpoint.  

description:  

KC: https://www.ibm.com/support/knowledgecenter/SSMNED_v10/com.ibm.apic.cmc.doc/tapic_audit_api_calls.html

## Procedure

### 1.build image

```
cd APIC_audit/Image/
sh build.sh <d|p> <tag>
```


### 2.manifest
Refer under the `APIC_audit/manifests/dev/` directory,  edit `Ingress.yml` and `Deployment.yml`

for `Deployment.yml`, `dumper` arguments are below

```
./dumper --help
Usage of ./dumper:
  -c string
        clean logged files that created before this period seconds. allowd string is 'never' or integer) (default "never")
  -d string
        the directory to store logfile instead of STDOUTing (default "/tmp/dump_audit")
  -e string
        the endpoint to logged data push (default "http://127.0.0.1:8080")
  -logout
        output POSTed data to logfile(default to output to stdout, with record)
  -p string
        listen port of this server (default "8080")
  -postflow
        post logged files to specified endpoint(logger) or remove periodic files(stdout).to disable this, pass the '--postflow=false' args. (default true)
  -r string
        the file path to store STDOUTed data's id (default "/tmp/dump_audit_record")
```


## specs
### overall

Receive Requests like following on the port selected by -p

```
POST / HTTP/1.1
Host: <...>
Content-length: <...>
Content-Type: application/json

{"id":<...>,[...]}
```

Response:

Successful

logger

<a id="output-logger-1"></a>

```
HTTP/1.1 200 OK
```

dumper

<a id="output-dumper-1"></a>
first to stdout for the value of {.id}

```
HTTP/1.1 200 OK
Dumper-Id-Holder: <...>
Dumper-Status: Outputed
```

<a id="output-dumper-2"></a>
stdouted more than once for the value of {.id}

```
HTTP/1.1 200 OK
Dumper-Id-Holder: <...>
Dumper-Status: Exist
```



Failure

other than POST method

```
HTTP/1.1 405 Method Not Allowed
```

the payload didn't contains {.id}, or the format of payload is not a JSON

```
HTTP/1.1 406 Not Acceptable
```

other errors like the failure response from dumper endpoint or file write failure.

```
HTTP/1.1 500 Internal Server Error
```



### dumper
command example: `./dumper -p 8080`  

- search the value of {.id} in which a JSON payload of POST request from the local file determined by `-r`
  - if there isn't, append the {.id} to the file `-r` defined[<a href="#output-dumper-1">Response</a>]
  - otherwise return a Response of "exists"[<a href="#output-dumper-2">Response</a>]


<a id="output-logger-1"></a>

### logger
command example: `./dumper --logout -p 8081 -e http://apic-audit-dumper.dsp-ns-access-apic.svc.cluster.local:8080`

- save the JSON payload of a POST request as a file named {.id} value to the `-d` defined directory
- after the saving, POST the file contents to the endpoint `-e` defined in an the order of FIFO
  - when received 200 status and the header value of `Dumper-Status` is `Outputed` or `Exist`, remove the file named the value of `Dumper-Id-Holder` header
  - otherwise keep until the condition.
  
