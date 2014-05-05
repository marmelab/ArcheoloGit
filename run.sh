#!/bin/bash

CSVFILE=`pwd`
CSVFILE+='/datas.csv'

echo 'date,commits,filePath' > $CSVFILE

if [ $# = 1 ]
then
    cd $1
fi

nbFile=`git ls-tree -r --name-only HEAD | wc -l | tr -d ' '`
echo "Number of files: $nbFile"

git ls-tree -r --name-only HEAD | while ((i++)); read filename; do
	echo "$(git log -1 --format="%ad" -- $filename),$(git log --oneline $filename | wc -l | tr -d ' '),$filename" >> $CSVFILE
	percent=$(($i*100/$nbFile))
	echo -en "\r"
	seq  -f "=" -s '' $percent
	echo -en ">$percent%"
done

echo -en "\n"
