#!/usr/bin/python
import json

fd = open('comments-meta.txt', 'r')

book = json.load(fd)

for chapter in book:
    chapter['number'] = int(chapter['number'])
    
book.sort(key=lambda chapter: chapter['number'])

for chapter in book:
    print chapter['number'], chapter['title'], len(chapter['comments'])
    
stats = [(chapter['number'], len(chapter['comments'])) for chapter in book]

