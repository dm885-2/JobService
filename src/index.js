import {host, query, subscriber} from "./helpers.js";
import SolverManager from "./SolverManager.js";
const manager = new SolverManager();

export async function addJob(msg, publish){
}

export async function queueCheck(msg, publish){
    
    const queue = await query("SELECT *, (SELECT `solverLimit` FROM `users` WHERE users.id = jobs.user LIMIT 1) as `solverLimit` FROM `jobs` WHERE `status` = '0' ORDER BY `id` ASC LIMIT 1");
    if(queue)
    {
        const job = queue[0];
        const solvers = manager.getIdleSolvers(Number(job.solverLimit)); 
        if(solvers)
        {
            console.log("Send jobs to theese solvers", solvers);
        }
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
    }
    
    solver.healthUpdate();
}

if(process.env.RAPID)
{
    subscriber(host, [
        {river: "jobs", event: "add-job", work: addJob}, // Adds a new job
        {river: "jobs", event: "queue-check", work: queueCheck}, // Runs the next job in the queue, if there is any
        {river: "jobs", event: "job-history", work: jobHistory}, // Gets the job history of a user

        // Solver manager stuff
        {river: "jobs", event: "solver-pong-response", work: solverHealth}, // Response of a solver health check
    ]);
}
