import rapid from "@ovcina/rapidriver";
import jwt from "jsonwebtoken";
import mysql from "mysql";

import rapidManager from "./rapid/RapidManager.js";

const SECRET = process.env.SECRET ?? `3(?<,t2mZxj$5JT47naQFTXwqNWP#W>'*Kr!X!(_M3N.u8v}%N/JYGHC.Zwq.!v-`;  // JWT secret
const rabbitUser = process.env.rabbitUser ?? "guest";
const rabbitPass = process.env.rabbitPass ?? "guest";
const host = "amqp://" + rabbitUser + ":" + rabbitPass + "@" + (process.env.rabbitHost ?? `localhost`);  // RabbitMQ url


const RapidManager = new rapidManager(host);

function publishAndWait(event, responseEvent, sessionID, data, userID)
{
    return new Promise(r => RapidManager.publishAndSubscribe(event, responseEvent, sessionID, data, r, userID));
}

/**
 * Automatically adds logging, request and sessionIDs to rabbit responses.
 * @param stromg host 
 * @param [] subscribers 
 */
let logStore = {};
function subscriber(host, subscribers)
 {
     rapid.subscribe(host, subscribers.map(subscriber => ({
         river: subscriber.river,
         event: subscriber.event,
         work: (msg, publish) => {
             let logPath = msg.logPath ?? [];
             const wrappedPublish = (event, data) => {
                logPath.push({
                    river: subscriber.river, 
                    event: subscriber.event
                });

                publish(event, {
                    ...data,
                    sessionId: msg.sessionId,
                    requestId: msg.requestId,
                    logPath: logPath,
                });
             };

             subscriber.work(msg, wrappedPublish);
         },
     })));
}

/**
 * Returns the token payload if its valid, otherwise it returns false.
 * @param String token 
 * @returns Promise<false|TokenData>
 */
function getTokenData(token)
{
    return new Promise(resolve => jwt.verify(token, SECRET, (err, data) => resolve(err ? false : data)));
}

let connection;
if(process.env.mysqlDb)
{
    connection = mysql.createConnection({
        host     : process.env.mysqlHost ?? 'localhost',
        user     : process.env.mysqlUser ?? 'root',
        password : process.env.mysqlPass ?? '',
        database : process.env.mysqlDb ?? 'db',
    });
    connection.connect();

    const res0 = await query("CREATE TABLE IF NOT EXISTS `jobs` (" +
    "`id` int(11) unsigned NOT NULL AUTO_INCREMENT," +
    "`userID` int(11) unsigned NOT NULL DEFAULT '0'," +
    "`status` int(11) unsigned NOT NULL DEFAULT '0'," +
    "`modelID` int(10) unsigned NOT NULL DEFAULT '0'," +
    "`dataID` int(10) unsigned NOT NULL DEFAULT '0'," +
    "`startTime` TEXT," +
    "`endTime` TEXT," +
    "KEY `Index 1` (`id`)" +
    "  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;");

    const res1 = await query("CREATE TABLE IF NOT EXISTS `jobOutput` (" +
    "`id` int(10) unsigned NOT NULL AUTO_INCREMENT," +
    "`content` TEXT," +
    "`jobID` int(10) unsigned NOT NULL DEFAULT '0'," +
    "KEY `Index 1` (`id`)," +
    "KEY `FK_jobOutput_jobs` (`jobID`)," +
    "CONSTRAINT `FK_jobOutput_jobs` FOREIGN KEY (`jobID`) REFERENCES `jobs` (`id`)" +
    " ) ENGINE=InnoDB DEFAULT CHARSET=latin1;");

    const res2 = await query("CREATE TABLE IF NOT EXISTS `jobParts` (" +
    "`id` int(10) unsigned NOT NULL AUTO_INCREMENT," +
    "`solverID` int(10) unsigned NOT NULL DEFAULT '0'," +
    "`flagS` int(1) unsigned NOT NULL DEFAULT '0'," +
    "`flagF` int(1) unsigned NOT NULL DEFAULT '0'," +
    "`timeLimit` int(1) unsigned NOT NULL DEFAULT '0'," +
    "`cpuLimit` int(1) unsigned NOT NULL DEFAULT '3'," +
    "`memoryLimit` int(11) unsigned NOT NULL DEFAULT '500'," +
    "`jobID` int(10) unsigned NOT NULL DEFAULT '0'," +
    "KEY `Index 1` (`id`)," +
    "KEY `FK_jobParts_jobs` (`jobID`)," +
    "CONSTRAINT `FK_jobParts_jobs` FOREIGN KEY (`jobID`) REFERENCES `jobs` (`id`)" +
    " ) ENGINE=InnoDB DEFAULT CHARSET=latin1;");
    
    if(!res0 || !res1 || !res2){
        process.exit(1);
    }
}

/**
 * Runs a SQL query on the DB. 
 * @param string stmt 
 * @param ?string[] WHERE 
 * @returns results[]|false
 */
function query(stmt, WHERE = [])
{
    return new Promise(r => connection.query(stmt, WHERE, (err, results) => r(err ? err : results)));
}

export default {
    host,
    subscriber,
    query,
    getTokenData,
    publishAndWait
}