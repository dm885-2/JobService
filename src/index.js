import {host, query, subscriber, publishAndWait} from "./helpers.js";
import SolverManager from "./SolverManager.js";
const manager = new SolverManager();

/*
{
    userID: number,
    solvers: [{
        modelID: number,
        dataID: number,
        // solver: "",
    }]
}
*/
export async function addJob(msg, publish){
    const stmt = await query("INSERT INTO `jobs` (`userID`) VALUES (?)", [
        msg.userID,
    ]);
    const jobID = stmt?.insertId;
    if(jobID)
    {
        for(let i = 0; i < msg.solvers.length; i++)
        {
            const solver = msg.solvers[i];
            await query("INSERT INTO `jobFiles` (`modelID`, `dataID`, `jobID`) VALUES (?, ?, ?)", [
                msg.model,
                msg.dataset,
                jobID,
            ]);
        }
    }

    publish("add-job-response", {
        error: !jobID,
    });
    publish("queue-check", {});
}

export async function queueCheck(msg, publish){
    const queue = await query("SELECT *, " +
    "(SELECT `solverLimit` FROM `users` WHERE users.id = jobs.userID LIMIT 1) as `solverLimit` " + 
    // "(SELECT `data` FROM `files` WHERE files.id = jobs.modelID LIMIT 1) as `modelContent`, " + 
    // "(SELECT `data` FROM `files` WHERE files.id = jobs.dataID LIMIT 1) as `dataContent` " + 
    "FROM `jobs` WHERE `status` = '0' ORDER BY `id` ASC LIMIT 1");
    console.log("Queue check", queue);
    
    if(queue && queue.length > 0)
    {
        const job = queue[0];

        const jobSolvers = await query("SELECT * FROM `jobFiles` WHERE `jobID` = ? ORDER BY `id` DESC", [
            job.id,
        ]);
        const neededResources = Math.min(Number(job.solverLimit), (jobSolvers || []).length);
        const solvers = manager.getIdleSolvers(neededResources); 
        // console.log(solvers, jobSolvers, job);
        if(solvers && neededResources > 0)
        {
            await query("UPDATE `jobs` SET `status` = '1', `startTime` = ? WHERE `id` = ?", [
                Date.now(),
                job.id,
            ]);
            console.log("Send jobs to theese solvers", solvers);
            solvers.forEach(async (solver, i) => {
                const target = jobSolvers[i];
                const [dataContent, modelContent] = await Promise.all([
                    publishAndWait("read-file", "read-file-response", 0, {
                        fileId: target.dataID,
                    }, -1),
                    publishAndWait("read-file", "read-file-response", 0, {
                        fileId: target.modelID,
                    }, -1),
                ]);
                console.log(dataContent, modelContent);
                if(!dataContent.error && !modelContent.error)
                {
                    console.log("Seinding sovle event!");
                    solver.busy = true;
                    solver.jobID = job.id;

                    publish("solve", {
                        solverID: solver.id,
                        problemID: job.id,
                        data: dataContent.data,
                        model: modelContent.data,
                        solver: false,
                        flagS: false,
                        flagF: false,
                    });
                }
            });
        }else if(neededResources === 0)
        {
            await query("UPDATE `jobs` SET `status` = '2', `endTime` = ? WHERE `id` = ?", [
                Date.now(),
                job.id,
            ]);
            publish("queue-check", {}); // Go to next element in queue
        }
    }
}

export async function jobFinished(msg, publish){
    let solver = manager.getSolver(msg.solverID);
    if(solver)
    {
        solver.busy = false;
    }
    console.log("Got something", msg);
    await query("INSERT INTO `jobOutput` (`content`, `jobID`) VALUES (?, ?)", [
        JSON.stringify(msg.data), // TODO: Dont just stringify it
        msg.problemID
    ]);

    const solvers = manager.getBusySolvers(msg.problemID);
    if(solvers.length === 0)
    {
        await query("UPDATE `jobs` SET `status` = '2', `endTime` = ? WHERE `id` = ?", [
            Date.now(),
            msg.problemID,
        ]);
        publish("queue-check", {});
    }
}

export async function jobHistory(msg, publish){
    const data = await query("SELECT * FROM `jobs` WHERE `userID` = ? ORDER BY `id` DESC LIMIT 50", [
        msg.userID // Should be token userID?
    ]);
    publish("job-history-response", {
        data: data || [],
    });
}

export async function solverHealth(msg, publish){
    let solver = manager.getSolver(msg.solverID);
    if(!solver)
    {
        solver = manager.newSolver(msg.solverID, msg.problemID);
        console.log("Discovered new solver #", msg.solverID, solver);
    }else{
        console.log("Solver alive", msg.solverID);
        solver.busy = msg.problemID !== -1;
    }
    
    solver.healthUpdate();
}

if(process.env.RAPID)
{
    subscriber(host, [
        {river: "jobs", event: "add-job", work: addJob}, // Adds a new job
        {river: "jobs", event: "queue-check", work: queueCheck}, // Runs the next job in the queue, if there is any
        {river: "jobs", event: "job-history", work: jobHistory}, // Gets the job history of a user
        {river: "jobs", event: "solver-response", work: jobFinished}, // A solver has answered
        
        // Solver manager stuff
        {river: "jobs", event: "solver-pong-response", work: solverHealth}, // Response of a solver health check
    ]);
}
