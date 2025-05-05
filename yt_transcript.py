#!/usr/bin/env python3
import os, sys

here = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(here, "python"))

import argparse
import re
import tempfile
import json
from yt_dlp import YoutubeDL

class SilentLogger:
    def debug(self, *args, **kwargs): pass
    def warning(self, *args, **kwargs): pass
    def error(self, *args, **kwargs): pass

def download_vtt(url: str, lang: str = "en"):
    tmpdir = tempfile.gettempdir()
    ydl_opts = {
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": [lang],
        "subtitlesformat": "vtt",
        "outtmpl": os.path.join(tmpdir, "%(id)s.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        "no_progress":      True,
        "logger":        SilentLogger(),
    }
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        video_id = info.get("id")
        # now download only the .vtt file
        ydl.params["skip_download"] = False
        ydl.download([url])

    subtitle_path = os.path.join(tmpdir, f"{video_id}.{lang}.vtt")
    if not os.path.isfile(subtitle_path):
        raise FileNotFoundError(f"No `{lang}` captions found for video {video_id}")
    return subtitle_path, info

def parse_vtt(path: str):
    """
    Returns a list of dicts with keys: start_ms, duration, text.
    """
    segments = []
    time_re = re.compile(
        r"^(\d{2}):(\d{2}):(\d{2}\.\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}\.\d{3})"
    )
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    i = 0
    while i < len(lines):
        m = time_re.match(lines[i].strip())
        if m:
            sh, sm, ss = m.group(1), m.group(2), m.group(3)
            eh, em, es = m.group(4), m.group(5), m.group(6)
            start_ms = int(sh) * 3600000 + int(sm) * 60000 + int(float(ss) * 1000)
            end_ms = int(eh) * 3600000 + int(em) * 60000 + int(float(es) * 1000)
            duration = end_ms - start_ms

            # collect text lines
            i += 1
            texts = []
            while i < len(lines) and lines[i].strip():
                texts.append(lines[i].strip())
                i += 1
            full_text = " ".join(texts)

            # build offsetText (e.g. "4:05")
            secs = start_ms // 1000
            offset_text = f"{secs//60}:{secs%60:02d}"

            segments.append({
                "text": full_text,
                "offset": start_ms,
                "offsetText": offset_text,
                "duration": duration,
            })
        else:
            i += 1

    return segments

def main():
    parser = argparse.ArgumentParser(
        description="Fetch a YouTube video's transcript and emit JSON"
    )
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument(
        "--lang", "-l", default="en",
        help="Caption language code (default: en)"
    )
    args = parser.parse_args()

    try:
        vtt_path, info = download_vtt(args.url, args.lang)
        segments = parse_vtt(vtt_path)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    output = {
        "title": info.get("title", ""),
        "transcript": segments,
    }

    # Print serialized JSON to stdout
    print(json.dumps(output, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
