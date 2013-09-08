import json

fd = open('comments-meta.txt', 'r')

meta = json.load(fd)

for chapter in meta:
    print chapter['url'], len(chapter['comments'])