#!/usr/bin/env python3
"""Téléverse un fichier local vers l'URL signée renvoyée par Motion upload_asset.
Usage : python3 televerser.py <fichier> <json_upload_asset>"""
import json, subprocess, sys
f, data = sys.argv[1], json.loads(sys.argv[2])
cmd = ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}"]
for k, v in data["upload_fields"].items():
    cmd += ["-F", f"{k}={v}"]
cmd += ["-F", f"file=@{f};type={data['content_type']}", data["upload_url"]]
print(subprocess.run(cmd, capture_output=True, text=True).stdout)
