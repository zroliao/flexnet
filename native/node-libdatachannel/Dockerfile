FROM ubuntu:20.04 AS build-base

# --------------------------------------------------------------
# specify the number of CPU core for compiling
# --------------------------------------------------------------

ENV CPU_CORE_NUM 16
ENV DEBIAN_FRONTEND=noninteractive

# --------------------------------------------------------------
# Tool-chains for building library
# --------------------------------------------------------------
FROM build-base AS ubuntu-build
# install necessary tools into docker image
RUN apt-get update -qq && apt-get install -y \
	autoconf \
	automake \
	build-essential \
	ninja-build \
	git \
	git-core \
	wget \
	libssl-dev \
	python-dev \
	python3-dev \
	curl

# --------------------------------------------------------------
# cmake (tool)
#   https://cmake.org/download/
# --------------------------------------------------------------
FROM ubuntu-build AS cmake-build
WORKDIR /tmp
RUN apt remove cmake && \
	mkdir /opt/cmake && \
	cd /tmp && \
	wget https://github.com/Kitware/CMake/releases/download/v3.23.1/cmake-3.23.1-linux-x86_64.sh && \
	sh ./cmake-3.23.1-linux-x86_64.sh --prefix=/opt/cmake --skip-license && \
	ln -f -s /opt/cmake/bin/cmake /usr/bin/cmake && \
	rm -rf /tmp/cmake-3.23.1-linux-x86_64.sh
 
# --------------------------------------------------------------
# node (tool)
# --------------------------------------------------------------
FROM cmake-build AS nodejs-build
WORKDIR /tmp
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash && \
	apt-get install -y nodejs
 
# -------------------------------------------------------------------------------------------------------------
# libdatachannel (v0.10.4)
#   https://github.com/paullouisageneau/libdatachannel
# -------------------------------------------------------------------------------------------------------------
FROM nodejs-build AS libdatachannel-build
WORKDIR /tmp
RUN env GIT_SSL_NO_VERIFY=true git clone --recursive https://github.com/paullouisageneau/libdatachannel.git && \
	cd /tmp/libdatachannel && \
	git checkout v0.17.3 && \
	mkdir -p /tmp/libdatachannel/build && cd /tmp/libdatachannel/build && \
	cmake -DUSE_GNUTLS=OFF -DUSE_NICE=OFF -DUSE_SYSTEM_SRTP=OFF -DNO_EXAMPLES=ON -DNO_TESTS=ON .. && \
	make -j${CPU_CORE_NUM} && \
	make datachannel-static -j${CPU_CORE_NUM} && \
	cp -d /tmp/libdatachannel/build/libdatachannel.so* /usr/local/lib && \
	cp -d /tmp/libdatachannel/build/libdatachannel-static.a /usr/local/lib && \
	cp -r /tmp/libdatachannel/include/rtc /usr/local/include && \
	cp -r /tmp/libdatachannel/deps/plog/include/plog /usr/local/include
	# rm -rf /tmp/libdatachannel

FROM libdatachannel-build AS node-libdatachannel-build
WORKDIR /tmp
RUN git clone https://github.com/murat-dogan/node-datachannel.git && \
	cd node-datachannel && \
	npm install && \
	npm run build && \
	cd /tmp && \
	cp -d /tmp/node-datachannel/build/Release/node_datachannel.node* /usr/local/lib && \
	mkdir volumn