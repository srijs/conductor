package main

import (
	"bytes"
	"log"
	"net"
	"net/http"
	"net/rpc"
	"os"
	"os/exec"
)

type Worker struct{}

type ExecReq struct {
	Name string
	Args []string
}

type ExecReply struct {
	Stdout string
	Stderr string
}

func (w *Worker) Exec(req ExecReq, reply *ExecReply) error {

	cmd := exec.Command(req.Name, req.Args...)

	stdout := new(bytes.Buffer)
	stderr := new(bytes.Buffer)

	cmd.Stdout = stdout
	cmd.Stderr = stderr

	err := cmd.Run()

	reply.Stdout = string(stdout.Bytes())
	reply.Stderr = string(stderr.Bytes())

	return err

}

func runWorker(name string) {

	rpc.Register(&Worker{})
	rpc.HandleHTTP()

	l, err := net.Listen("unix", name+".sock")
	if err != nil {
		log.Fatal("listen error:", err)
	}

	http.Serve(l, nil)

}

func main() {

	runWorker(os.Getenv("WORKER"))

}
