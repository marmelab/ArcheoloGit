#!/bin/bash

CSVFILE=`pwd`
CSVFILE+='/datas.csv'

echo 'date,commits,filePath' > $CSVFILE

if [ $# = 1 ]
then
    cd $1
fi

tree=`git ls-tree -r --name-only HEAD`
nbFiles=`echo "$tree" | wc -l`
echo "Number of files: $nbFiles"


echo "$tree" | while ((i++)); read filename; do
	echo "$(git log -1 --format="%ad" -- $filename),$(git log --oneline $filename | wc -l | tr -d ' '),$filename" >> $CSVFILE
	percent=$(($i*100/$nbFiles))
	echo -en "\r"
	seq  -f "=" -s '' $percent
	echo -en ">$percent%"
done

echo -en "\n"
