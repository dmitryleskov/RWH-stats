import json

fd = open('comments-meta.txt', 'r')

meta = json.load(fd)

print meta
