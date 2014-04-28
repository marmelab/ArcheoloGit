#!/bin/bash

CSVFILE=`pwd`
CSVFILE+='/datas.csv'

echo 'date,nbCommits,filePath' > $CSVFILE

if [ $# = 1 ]
then
    cd $1
fi

git ls-tree -r --name-only HEAD | while read filename; do
	echo "$(git log -1 --format="%ad" -- $filename),$(git log --oneline $filename | wc -l | tr -d ' '),$filename" >> $CSVFILE
done
