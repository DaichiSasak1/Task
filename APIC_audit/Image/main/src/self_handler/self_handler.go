package self_handler

import (
    "strconv"
    "net/http"
    "io"
    "encoding/json"
		"self_output"
)

func RequestHandler(w http.ResponseWriter, r *http.Request) {
  if r.Method != http.MethodPost {
    w.WriteHeader(http.StatusMethodNotAllowed)
    return
  }
  length, err := strconv.Atoi(r.Header.Get("Content-Length"))
  if err != nil {
    w.WriteHeader(http.StatusInternalServerError)
    return
  }
  //Read body data to parse json
  body := make([]byte, length)
  length, err = r.Body.Read(body)
  if err != nil && err != io.EOF {
    w.WriteHeader(http.StatusInternalServerError)
    return
  }
  var jsonBody map[string]interface{}
  err = json.Unmarshal(body[:length], &jsonBody)
  if err != nil {
    w.WriteHeader(http.StatusNotAcceptable)
    return
  }
	if _, err := jsonBody[self_output.CADF_IDString];!err {
		w.WriteHeader(http.StatusNotAcceptable)
		return
	}
	
	// Writeout the POSTed data to log or stdout
	err = self_output.WriteoutFunc(self_output.Outputter, jsonBody[self_output.CADF_IDString].(string), body, length, &w)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
	} else {
		w.WriteHeader(http.StatusOK)
	}
	// write to response body
	// fmt.Fprintf(w,"text to write")
}
