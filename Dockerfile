FROM        ubuntu:trusty
MAINTAINER  Christoph Hartmann "chris@lollyrock.com"

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get -qy install language-pack-en 

ENV LANGUAGE en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8
RUN locale-gen en_US.UTF-8
RUN dpkg-reconfigure locales

# Install nodejs
RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup | bash -
RUN apt-get install -y nodejs

# Install npm dependencies for gyp
RUN apt-get install -y build-essential git zlib1g-dev python tar

# Add radiowave
COPY . /app
RUN cd /app; npm install
COPY ./settings/default.json /config/radiowave.json

# PORTS for default config:
# TCP
EXPOSE 5222
# BOSH
EXPOSE 5280
# Websocket
EXPOSE 9031
# Engine.io
EXPOSE 9030
# Rest API
EXPOSE 8080

CMD ["node", "/app/bin/radiowave", "/config/radiowave.json"]