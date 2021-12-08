import {host, query, subscriber, getTokenData} from "./helpers.js";
import SolverManager from "./SolverManager.js";
const manager = new SolverManager();

export async function addJob(msg, publish){
    const tokenData = getTokenData(msg.token);
    const stmt = await query("INSERT INTO `jobs` (`userID`, `modelID`, `dataID`) VALUES (?, ?, ?)", [
        tokenData.id,
        msg.modelID,
        msg.dataID,
    ]);

    publish("add-job-response", {
        error: !!stmt,
    });
}

export async function queueCheck(msg, publish){
    
    const queue = await query("SELECT *, (SELECT `solverLimit` FROM `users` WHERE users.id = jobs.user LIMIT 1) as `solverLimit`, (SELECT `data` FROM `files` WHERE files.id = jobs.modelID LIMIT 1) as `modelContent` , (SELECT `data` FROM `files` WHERE files.id = jobs.dataID LIMIT 1) as `dataContent` FROM `jobs` WHERE `status` = '0' ORDER BY `id` ASC LIMIT 1");
    if(queue && queue.length > 0)
    {
        const job = queue[0];
        const solvers = manager.getIdleSolvers(Number(job.solverLimit)); 
        if(solvers)
        {
            await query("UPDATE `jobs` SET `status` = '1' WHERE `id` = ?", [
                job.id,
            ]);
            console.log("Send jobs to theese solvers", solvers);
            solvers.forEach(solver => {
                solver.busy = true;
                solver.jobID = job.id;

                publish("solve", {
                    solverID: solver.id,
                    problemID: job.id,
                    data: solver.dataContent,
                    model: solver.modelContent,
                    solver: false,
                    flagS: false,
                    flagF: false,
                });
            });
        }
    }
}

export async function jobFinished(msg, publish){
    let solver = manager.getSolver(msg.solverID);
    if(solver)
    {
        solver.busy = false;
    }

    const solvers = getBusySolvers(msg.problemID);
    if(solvers.length === 0)
    {
        await query("UPDATE `jobs` SET `status` = '2' WHERE `id` = ?", [
            job.id,
        ]);
    }
}

export async function jobHistory(msg, publish){
    const data = await query("SELECT * FROM `jobs` WHERE `user` = ? ORDER BY `id` DESC LIMIT 50", [
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
        solver = manager.newSolver(msg.solverID, msg.busy);
    }else{
        solver.busy = msg.busy;
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
