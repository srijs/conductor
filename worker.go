package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
)

type ExecReq struct {
	Name string   `json:"name"`
	Args []string `json:"args"`
}

type ExecReply struct {
	Stdout  string `json:"stdout"`
	Stderr  string `json:"stderr"`
	Success bool   `json:"success"`
	Error   string `json:"error"`
}

func Exec(req ExecReq, reply *ExecReply) {

	cmd := exec.Command(req.Name, req.Args...)

	stdout := new(bytes.Buffer)
	stderr := new(bytes.Buffer)

	cmd.Stdout = stdout
	cmd.Stderr = stderr

	err := cmd.Run()

	reply.Stdout = string(stdout.Bytes())
	reply.Stderr = string(stderr.Bytes())
	reply.Success = cmd.ProcessState.Success()
	if err != nil {
		reply.Error = err.Error()
	}

}

func runWorker(name string) {

	http.HandleFunc("/exec", func(w http.ResponseWriter, r *http.Request) {

		defer r.Body.Close()

		if r.Method != "POST" {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		dec := json.NewDecoder(r.Body)

		var execReq ExecReq
		err := dec.Decode(&execReq)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		var execReply ExecReply

		Exec(execReq, &execReply)

		buf, err := json.Marshal(&execReply)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write(buf)

	})

	l, err := net.Listen("unix", name+".sock")
	if err != nil {
		log.Fatal("listen error:", err)
	}

	http.Serve(l, nil)

}

func main() {

	runWorker(os.Getenv("WORKER"))

}
