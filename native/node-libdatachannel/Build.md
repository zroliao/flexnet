Ubuntu Build 可使用 Dockerfile
 1. docker build -t node-libdatachannel-master . --no-cache
 2. docker images
 3. mkdir storage
 3. docker run -it -v /home/skyrechq/Downloads/node-libdatachannel/storage:/tmp/storage node-libdatachannel-master /bin/bash
 
 - 最後的檔案輸出在 docker 內的 /tmp/node-datachannel/build/Release/node_datachannel.node*
 
Windows Build 可以下載 node-ibdatachannel 然後根據官方流程
 - 安裝 cmake, visual studio, openssl
 - git clone
 - npm install
 - change CMakelist.txt 修改下面這段

``` 
	# Fetch libdatachannel
	FetchContent_Declare(
		libdatachannel
		GIT_REPOSITORY https://github.com/DZLiao/libdatachannel.git
		GIT_TAG        "sr0.10.4"
	)
```