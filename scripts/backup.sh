#!/bin/sh
# Dumps the live Paperbots db and stores it in Google Drive.
# You need to install this https://github.com/prasmussen/gdrive
# On macOS, brew install gdrive will do the trick.

# You have to specify the server user, host and sudo pwd
# You have to specify the Paperbots db Docker container name, db port, and db password
# You have to specify the GDrive folder Id to store the backup in. Use `gdrive list` to get the folder id.

# Pray and hope nobody sniffs your connection...

set -e

if [ -z $SERVER_USER ]; then echo "Specify \$SERVER_USER"; exit -1; fi
if [ -z $SERVER_HOST ]; then echo "Specify \$SERVER_HOST"; exit -1; fi
if [ -z $SERVER_PWD ]; then echo "Specify \$SERVER_PWD"; exit -1; fi
if [ -z $PAPERBOTS_DB_CONTAINER ]; then echo "Specify \$PAPERBOTS_DB_CONTAINER"; exit -1; fi
if [ -z $PAPERBOTS_DB_PWD ] ; then echo "Specify \$PAPERBOTS_DB_PWD"; exit -1; fi
if [ -z $PAPERBOTS_DB_PORT ] ; then echo "Specify \$PAPERBOTS_DB_PORT"; exit -1; fi
if [ -z $GDRIVE_FOLDER ] ; then echo "Specify \$GDRIVE_FOLDER"; exit -1; fi

# MySQL dump
MYSQL_DUMP_FILE="paperbots-`date +%F`.sql"
ZIP_DUMP_FILE="$MYSQL_DUMP_FILE.tar.gz"
echo "Dumping paperbots database to $MYSQL_DUMP_FILE"
ssh -l $SERVER_USER $SERVER_HOST "echo $SERVER_PWD | sudo -S docker exec $PAPERBOTS_DB_CONTAINER mysqldump --default-character-set=utf8mb4 -uroot -p$PAPERBOTS_DB_PWD --port $PAPERBOTS_DB_PORT paperbots" > $MYSQL_DUMP_FILE
echo "Uploading $DUMP_FILE to GDrive"
tar -czvf $ZIP_DUMP_FILE $MYSQL_DUMP_FILE
gdrive upload -p $GDRIVE_FOLDER $ZIP_DUMP_FILE
rm $MYSQL_DUMP_FILE
rm $ZIP_DUMP_FILE

# Files dump
FILES_DUMP_FILE=paperbots-`date +%F`-files.tar.gz
ssh -l $SERVER_USER $SERVER_HOST "rm -f paperbots-files.tar.gz && tar -C paperbots.io/docker/data/ -czvf paperbots-files.tar.gz files"
scp $SERVER_USER@$SERVER_HOST:/home/$SERVER_USER/paperbots-files.tar.gz $FILES_DUMP_FILE
gdrive upload -p $GDRIVE_FOLDER $FILES_DUMP_FILE
rm $FILES_DUMP_FILE

