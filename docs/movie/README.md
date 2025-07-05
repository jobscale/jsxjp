```
ffmpeg -i input.mov -vf "format=yuv420p" -profile:v baseline -level 3.0 -s 640x360 -start_number 0 -hls_time 10 -hls_list_size 0 -f hls output.m3u8
```
