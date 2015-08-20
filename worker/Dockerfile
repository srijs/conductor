FROM golang:1.5

ADD worker.go /go/src/worker/
RUN go build -v worker

RUN mkdir -p /worker
WORKDIR /worker
