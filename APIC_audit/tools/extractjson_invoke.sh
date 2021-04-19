#!/bin/sh
I=audit/raw_log
O=audit/formatted_log
 #for f in $(ls $I);do echo $f;python extractjson.py $I/$f $@ > $I/${f##*.}.formatted;done
 for f in $(ls $I);do echo $f;python extractjson.py $I/$f $@ ;done

