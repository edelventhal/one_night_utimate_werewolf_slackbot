#first make sure we have it installed
redisVersion=`brew ls --versions redis`
if [[ -z $redisVersion ]]
then
    brew install redis
fi

#kill any existing redis processes
pkill -f redis

#run the server
redis-server /usr/local/etc/redis.conf