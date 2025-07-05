### default
```
ffmpeg -i input.mov \
  -vf "format=yuv420p" \
  -profile:v baseline -level 3.0 -s 640x360 \
  -start_number 0 \
  -hls_time 10 -hls_list_size 0 \
  -f hls output.m3u8
```

### 400 kbps / 64 kbps
```
ffmpeg -i input.mov \
  -vf "format=yuv420p" \
  -c:v libx264 -b:v 400k -maxrate 400k -bufsize 800k \
  -profile:v baseline -level 3.0 -s 640x360 \
  -c:a aac -b:a 64k \
  -start_number 0 \
  -hls_time 10 -hls_list_size 0 \
  -f hls output.m3u8
```

