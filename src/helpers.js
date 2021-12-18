import rapid from "@ovcina/rapidriver";
import jwt from "jsonwebtoken";
import mysql from "mysql";

import RapidManager from "./rapid/RapidManager.js";

const SECRET = process.env.SECRET ?? `3(?<,t2mZxj$5JT47naQFTXwqNWP#W>'*Kr!X!(_M3N.u8v}%N/JYGHC.Zwq.!v-`;  // JWT secret
const rabbitUser = process.env.rabbitUser ?? "guest";
const rabbitPass = process.env.rabbitPass ?? "guest";
export const host = "amqp://" + rabbitUser + ":" + rabbitPass + "@" + (process.env.rabbitHost ?? `localhost`);  // RabbitMQ url


export function publishAndWait(event, responseEvent, sessionID, data, userID)
{
    return new Promise(r => RapidManager.publishAndSubscribe(event, responseEvent, sessionID, data, r, userID));
}

/**
 * Automatically adds logging, request and sessionIDs to rabbit responses.
 * @param stromg host 
 * @param [] subscribers 
 */
 export function subscriber(host, subscribers)
 {
     rapid.subscribe(host, subscribers.map(subscriber => ({
         river: subscriber.river,
         event: subscriber.event,
         work: (msg, publish) => {
             const wrappedPublish = (event, data) => {
                let logPath = msg.logPath ?? [];
                logPath.push({
                    river: subscriber.river, 
                    event: subscriber.event
                });

                publish(event, {
                    ...data,
                    sessionId: msg.sessionId,
                    requestId: msg.requestId,
                    logPath
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
export function getTokenData(token)
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

    const res1 = await query("CREATE TABLE IF NOT EXISTS `jobFiles` (" +
    "`id` int(10) unsigned NOT NULL AUTO_INCREMENT," +
    "`dataID` int(10) unsigned NOT NULL DEFAULT '0'," +
    "`modelID` int(10) unsigned NOT NULL DEFAULT '0'," +
    "`jobID` int(10) unsigned NOT NULL DEFAULT '0'," +
    "KEY `Index 1` (`id`)," +
    "KEY `FK_jobFiles_jobs` (`jobID`)," +
    "CONSTRAINT `FK_jobFiles_jobs` FOREIGN KEY (`jobID`) REFERENCES `jobs` (`id`)" +
    " ) ENGINE=InnoDB DEFAULT CHARSET=latin1;");

    const res2 = await query("CREATE TABLE IF NOT EXISTS `jobs` (" +
    "`id` int(11) unsigned NOT NULL AUTO_INCREMENT," +
    "`userID` int(11) unsigned NOT NULL DEFAULT '0'," +
    "`status` int(11) unsigned NOT NULL DEFAULT '0'," +
    "KEY `Index 1` (`id`)," +
    "KEY `FK__users` (`userID`)," +
    "CONSTRAINT `FK__users` FOREIGN KEY (`userID`) REFERENCES `users` (`id`)" +
    "  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;");
    
    if(!res1 || !res2) process.exit(1);
}

/**
 * Runs a SQL query on the DB. 
 * @param string stmt 
 * @param ?string[] WHERE 
 * @returns results[]|false
 */
export function query(stmt, WHERE = [])
{
    return new Promise(r => connection.query(stmt, WHERE, (err, results) => r(err ? false : results)));
}