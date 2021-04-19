FROM registry.access.redhat.com/ubi8/go-toolset
COPY ./main /tmp/main
ENV GOPATH=/tmp/main TMPEXEC=/tmp/dumper
RUN go build -o ${TMPEXEC} /tmp/main/dumper.go

FROM registry.access.redhat.com/ubi8/ubi
RUN dnf update -y openssl-libs gnutls
ENV USER=dumper TMPEXEC=/tmp/dumper
ENV WDIR=/home/${USER}
ENV EXEC=${WDIR}/dumper
RUN useradd -m -u 1001 ${USER}
COPY --from=0 ${TMPEXEC} ${EXEC}
WORKDIR ${WDIR}
RUN chown ${USER}:${USER} ${EXEC} && chmod 755 ${EXEC}
USER ${USER}
CMD ["sh", "-c","${EXEC}", "-p", "8080"]

