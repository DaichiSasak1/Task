package self_output

import (
	  "net/http"
    "fmt"
		"bufio"
    "time"
		"os"
		"io"
		"sort"
		"io/ioutil"
		"strings"
    "strconv"
		"log"
		"path"
)


const (
	StatusHeaderKey    = "Dumper-Status"
	IdHolder           = "Dumper-Id-Holder"
	StatusIsOuted      = "Outputed"
	StatusIsExist      = "Exist"


	// defined by Container Auditing Data Federation
	CADF_IDString      = "id"

	// content type to use within this transaction
	ContentType        = "application/json"

	//default values in command line option
	DefaultWriteoutDir = "/tmp/dump_audit"
	DefaultRecordFile  = "/tmp/dump_audit_record"
	DefaultEndpoint    = "http://127.0.0.1:8080"
	DefaultPort        = "8080"

  // the null value of remove period, indicates never remove outputted files
  NullPeriodicValue  = "never"
)

var (
	Logger   = log.New(os.Stdout, "info: ", (log.LstdFlags | log.Llongfile))
	Warn     = log.New(os.Stdout, "warn: ", (log.LstdFlags | log.Llongfile))
	Error      = log.New(os.Stdout, "error: ", (log.LstdFlags | log.Llongfile))

	Outputter Output
)


type Output interface{
	writeout(id string, body []byte, length int, w *http.ResponseWriter) error
	pushto() error
	handleResponse(resp *http.Response) error
}


type StdOut struct {
	RecordFile string
  WriteoutDir string
	Endpoint string
  PostFlow bool
  CleanPeriod string
  Writeout bool
}

type LogFileOut struct {
  WriteoutDir string
	Endpoint string
  PostFlow bool
}




func WriteoutFunc (o Output, id string, body []byte, length int, w *http.ResponseWriter) error {
	err := o.writeout(id, body, length, w)
	if err != nil {
		Logger.Println(err)
	}
  err = o.pushto()
  if err != nil {
    Error.Println(err)
    return err
  }
  return nil
}

func IsExist(path string) bool {
	_,err := os.Stat(path)
	return !os.IsNotExist(err)
}

func MkdirP(path string) error {
	if !IsExist(path) {
		return os.MkdirAll(path, 0775)
	}
	return nil
}

func Touch(path string) error {
	if !IsExist(path) {
		file,err := os.Create(path)
		if err != nil {
			return err
		}
		defer file.Close()
	}
	return nil
}

func TouchTmp(dir string, id string) (*os.File, error) {
  writeoutFile := path.Join(dir, id)
  if err := Touch(writeoutFile);err != nil {
    Error.Println(err)
    return nil,err
  }
  return os.Create(writeoutFile)
}


func SortByTime(dir_path string) ([]os.FileInfo, error) {
	files,err := ioutil.ReadDir(dir_path)
	if err != nil {
		return nil, err
	}
	sort.Slice(files, func(i,j int) bool {
		return files[i].ModTime().Before(files[j].ModTime())
		})
	return files, nil
}

func FindByTime(dir_path string, period_seconds int) ([]os.FileInfo, error) {
  files,err := ioutil.ReadDir(dir_path)
  if err != nil {
    return nil, err
  }
  ret_files := files[:0]
  now := int(time.Now().Unix())
  for _,f := range files {
    if ((now - int(f.ModTime().Unix())) > period_seconds) {
      ret_files = append(ret_files, f)
    }
  }
  return ret_files, nil
}

func (o LogFileOut) writeout(id string, body []byte, length int, w *http.ResponseWriter) error {
	//Make subdirectory as is `mkdir -p`
	if err := MkdirP(o.WriteoutDir); err != nil {
		return err
	}
	//return when the file named as id already exist
  file,err := TouchTmp(o.WriteoutDir, id)
  if err != nil {
    return err
  }
	defer file.Close()

	b := []byte(body)
	_, err = file.Write(b)
	if err != nil {
		Error.Println(err)
		return err
	}
	return nil
}

func (o StdOut) writeout(id string, body []byte, length int, w *http.ResponseWriter) error {
	//return when the file named as id already exist
	//fmt.Println(string(append(body, '\n')))
  var file *os.File
	if err := Touch(o.RecordFile);err != nil {
		Error.Println(err)
		return err
	}

	fp,err := os.OpenFile(o.RecordFile, os.O_APPEND|os.O_RDWR, 0666)
	if err != nil {
		Error.Println(err)
		return err
	}
	defer fp.Close()
	reader := bufio.NewReaderSize(fp, 1024)
	status := StatusIsOuted
	for {
		line,_, err := reader.ReadLine()
		if string(line) == id {
			status = StatusIsExist
			Logger.Println("exists.")
			break
		} else if err == io.EOF {
			break
		} else if err != nil {
			return err
		}
	}
	if status == StatusIsOuted {
    if o.Writeout {
      if err := MkdirP(o.WriteoutDir); err != nil {
        return err
      }
      //return when the file named as id already exist
      file,err = TouchTmp(o.WriteoutDir, id)
      defer file.Close()
      if err != nil {
        return err
      }
    } else {
      file = os.Stdout
    }

    // writeout bode and id to Stdout or WriteoutDir
		fp.Write(append([]byte(id),'\n'))
		//fmt.Println(string(body))
		_,err := fmt.Fprint(file, string(body))
    fmt.Printf("\n")
    if err != nil {
      Error.Println(err)
    }
	}
	responsewrite := *w
	responsewrite.Header().Set(StatusHeaderKey, status)
	responsewrite.Header().Set(IdHolder, id)

	return nil
}

func (o StdOut) pushto() error {
	// delete files of out of period
  if (o.CleanPeriod == NullPeriodicValue) {
    return nil
  }
  if (!o.PostFlow) {
    return nil
  }
  p,_ := strconv.Atoi(o.CleanPeriod)
  files, err := FindByTime(o.WriteoutDir, p)
	if err != nil { 
		return nil
	}
  for _,file := range files {
    rm := path.Join(o.WriteoutDir,file.Name())
		if err := os.Remove(rm);err != nil {
			Error.Println(err)
			return err
		}
	}
	return nil
}

func (o LogFileOut) pushto() error {
  if (!o.PostFlow) {
    return nil
  }
	host := o.Endpoint
	logdir := o.WriteoutDir
	files,err := SortByTime(logdir)
	if err != nil { 
		return nil
	}
	for file := range files {
		fileBaseStr := files[file].Name()
		fileStr := path.Join(logdir, fileBaseStr)
		Logger.Print(fileStr)
		buf,err := ioutil.ReadFile(fileStr)
		//buf,err := os.OpenFile(fileStr, os.O_RDONLY, 0444)
		if err != nil {
			Error.Println(err)
			return err
		}
		// defer buf.Close()
		resp,err := http.Post(host, ContentType, strings.NewReader(string(buf)))
		//resp,err := http.Post(host, ContentType, buf)

		if err != nil {
			Error.Println(err)
			return err
		}
		defer resp.Body.Close()
		err = o.handleResponse(resp)
		if err != nil {
			Error.Println(err)
			return err
		}
	}
	return nil
}

func (o StdOut) handleResponse(resp *http.Response) error {
	return nil
}

func (o LogFileOut) handleResponse(resp *http.Response) error {
	if resp.StatusCode != http.StatusOK {
		Error.Print("server to push data returned non-OK status[%d]", resp.StatusCode)
		return fmt.Errorf("dump endpoint returns an error %d",resp.StatusCode)
	}
	//resp,err := ioutil.ReadAll(req.Body)
	//if err != nil {
	//	return err
	//}
	var statusHeader,id string
	getHeader := func (key string) string {
		val,ext := resp.Header[key]
		if ext {
			  return strings.Join(val,"")
		} else {
			  Logger.Printf("The response Header doesn't have '%s' key", key)
				return ""
		}
	}
	statusHeader = getHeader(StatusHeaderKey)
	id           = getHeader(IdHolder)

	// delete the already outputted (the remote output server recognized) files
	if statusHeader==StatusIsExist || statusHeader==StatusIsOuted {
		file := path.Join(o.WriteoutDir,id)
		if err := os.Remove(file);err != nil {
			Error.Println(err)
			return err
		}
	}
	return nil
}
