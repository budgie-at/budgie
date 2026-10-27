#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -ne 2 || ! -f "$1" ]]; then
    echo 'usage: compose-app-store-preview.sh <raw-recording.mp4> <output-directory>' >&2
    exit 1
fi

command -v ffmpeg >/dev/null
command -v ffprobe >/dev/null
command -v jq >/dev/null

source_path="$1"
output_directory="$2"
source_metadata="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of json "$source_path")"
if ! jq -e '.streams[0] | .width == 1320 and .height == 2868 and (.duration | tonumber) >= 20' <<< "$source_metadata" >/dev/null; then
    echo 'error: expected at least 20 seconds of 1320x2868 iPhone capture; no padded or stretched sources' >&2
    exit 1
fi

work_root="$(mktemp -d "${TMPDIR:-/tmp}/budgie-preview.XXXXXX")"
trap 'rm -rf "$work_root"' EXIT

ffmpeg -nostdin -y -hide_banner -loglevel error -i "$source_path" \
    -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 \
    -t 20 -map 0:v:0 -map 1:a:0 \
    -vf 'scale=886:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=886:1920,setsar=1,fps=30' \
    -c:v libx264 -profile:v high -level:v 4.0 -preset slow -pix_fmt yuv420p \
    -b:v 10M -maxrate 12M -bufsize 20M -g 60 \
    -c:a aac -b:a 256k -ac 2 -ar 48000 -movflags +faststart \
    "$work_root/01_IPHONE_67.mp4"

metadata="$(ffprobe -v error -show_streams -show_format -of json "$work_root/01_IPHONE_67.mp4")"
if ! jq -e '
    (.format.duration | tonumber) >= 15 and (.format.duration | tonumber) <= 30 and
    (.format.size | tonumber) < 500000000 and
    ([.streams[] | select(.codec_type == "video")][0] |
        .width == 886 and .height == 1920 and .codec_name == "h264" and
        .profile == "High" and .level == 40 and .pix_fmt == "yuv420p" and .r_frame_rate == "30/1") and
    ([.streams[] | select(.codec_type == "audio")][0] |
        .codec_name == "aac" and .channels == 2 and .sample_rate == "48000")
' <<< "$metadata" >/dev/null; then
    echo 'error: encoded preview does not meet the App Store delivery contract' >&2
    exit 1
fi

mkdir -p "$output_directory"
cp "$work_root/01_IPHONE_67.mp4" "$output_directory/01_IPHONE_67.mp4"
echo "wrote $output_directory/01_IPHONE_67.mp4 (886x1920, 20s, H.264 High 4.0, 30fps, AAC stereo)"
