package main

import (
	  "fmt"
		"flag"
    "strconv"
    "net/http"
		"self_handler"
		"self_output"
)


var (
	logout        = flag.Bool("logout", false, "output POSTed data to logfile(default to output to stdout, with record)")
	record_path   = flag.String("r", self_output.DefaultRecordFile, fmt.Sprintf("the file path to store STDOUTed data's id"))
	writeout_path = flag.String("d", self_output.DefaultWriteoutDir, fmt.Sprintf("the directory to store logfile instead of STDOUTing"))
	endpoint      = flag.String("e", self_output.DefaultEndpoint, fmt.Sprintf("the endpoint to logged data push"))
	port          = flag.String("p", self_output.DefaultPort, fmt.Sprintf("listen port of this server"))
  postflow      = flag.Bool("postflow", true, "post logged files to specified endpoint(logger) or remove periodic files(stdout).to disable this, pass the '--postflow=false' args.")
  clean_period  = flag.String("c", self_output.NullPeriodicValue, fmt.Sprintf("clean logged files that created before this period seconds. allowd string is '%s' or integer)",self_output.NullPeriodicValue))
)


func main(){
	InitializeHandler()
	http.HandleFunc("/", self_handler.RequestHandler)
	listenPort  := ":" + *port
	self_output.Logger.Printf("dump server started. Listen on %s", listenPort)
	self_output.Error.Fatal(http.ListenAndServe(listenPort, nil))
}

func InitializeHandler () {
	flag.Parse()
  writeout := *writeout_path != self_output.DefaultWriteoutDir
	stdOut :=  self_output.StdOut{RecordFile: *record_path, WriteoutDir: *writeout_path, Endpoint: *endpoint, PostFlow: *postflow, CleanPeriod: parsePeriod(*clean_period),  Writeout: writeout}
	logOut :=  self_output.LogFileOut{WriteoutDir: *writeout_path, Endpoint: *endpoint, PostFlow: *postflow}
	if *logout {
		self_output.Outputter = logOut
		self_output.Logger.Printf("configured as log store mode.(stored data is in %s)",logOut.WriteoutDir)
    if *postflow {
      self_output.Logger.Printf("the endpoint to logged data push is set as %s", logOut.Endpoint)
    } else {
      self_output.Logger.Printf("push logged data after receiving POST feature disabled. only create log")
    }
	} else {
		self_output.Outputter = stdOut
		if writeout {
			self_output.Warn.Printf("the writeout log path defined, write out in same manner of STDOUT mode instead of stdout")
		}
    if *postflow {
      self_output.Logger.Printf("saved files instead of STDOUT are removed if they are older than %s sec.", stdOut.CleanPeriod)
    } else {
      self_output.Logger.Printf("removing old files feature disabled. only create log")
    }
	}
}

func parsePeriod (p string) string {
  if !IsNum(p) && p != self_output.NullPeriodicValue {
      self_output.Error.Fatal(fmt.Sprintf("the argument of -c must be '%s' or integer that indicates removal file created time period(the argument -o value in STDOUT mode) on POSTed timing\n malformed value '%s', aborted.",( self_output.NullPeriodicValue),p))
  }
  return p
}
     


func IsNum(s string) bool {
  _,err := strconv.Atoi(s)
  return err == nil
}
