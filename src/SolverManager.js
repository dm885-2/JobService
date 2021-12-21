import rapid from "@ovcina/rapidriver";

import helpers from "./helpers.js";

class Solver {
    id = -1;
    jobID = -1;
    #isBusy = false;

    #healthy = true;
    #lastMessage = Date.now();

    set busy(val)
    {
        if(typeof val === "boolean")
        {
            this.#isBusy = val;
            this.jobID = -1;
        }
    }

    /**
     * Checks if the solver is busy and healthy.
     */
    get busy() {
        return this.#isBusy || !this.#healthy; 
    }

    /**
     * Sets the solver to healthy.
     */
    healthUpdate()
    {
        this.#healthy = true;
        this.#lastMessage = Date.now();
    }

    /**
     * Performs a health check on the solver.
     * @returns boolean - Returns false if the solver is dead.
     */
    healthCheck()
    {
        if(this.#healthy)
        {
            this.#healthy = false;
            rapid.publish(helpers.host, "solver-ping", {
                solverID: this.id, 
            });
        }else if((Date.now() - this.#lastMessage) >= (1000 * 60 * 60)) // Hasent responded to health checks for atleast an hour
        {
            return false;
        }
        return true;
    }
}

export default class SolverManager {
    #solvers = [];

    constructor()
    {
        setTimeout(() => this.discover(), 5000);
        setTimeout(() => this.queueCheck(), 7000);
        setInterval(() => this.healthCheck(), 1000 * 60 * 5); // Runs health check every 5 minute.
    }

    get solvers()
    {
        return this.#solvers.length;
    }

    /**
     * Discovers all solver-services already running.
     */
    discover()
    {
        console.log("Discovering..");
        rapid.publish(helpers.host, "solver-ping", {});
    }

    /**
     * Checks the queue for waiting stuff.
     */
    queueCheck()
    {
        rapid.publish(helpers.host, "queue-check", {});
    }

    /**
     * Adds a new solver to the manager.
     * @param string id 
     * @param boolean busy 
     * @returns Solver
     */
    newSolver(id, problemID)
    {
        const temp = new Solver();
        this.#solvers.push(temp);

        temp.id = id;
        temp.jobID = problemID;
        temp.busy = problemID !== -1;

        return temp;
    }

    /**
     * Returns a solver with the given a ID, if it exists.
     * @param string id 
     * @returns Solver | undefined
     */
    getSolver(id)
    {
        return this.#solvers.find(solver => solver.id === id);
    }

    /**
     * Removes a solver with the given a ID, if it exists.
     * @param string id 
     */
    removeSolver(id)
    {
        this.#solvers = this.#solvers.filter(solver => solver.id !== id);
    }

    /**
     * Performs a health-check on all its solvers.
     */
    healthCheck()
    {
        [...this.#solvers].forEach(solver => {
            const health = solver.healthCheck();
            if(!health)
            {
                this.removeSolver(solver.id);
                if(solver.jobID !== -1)
                {
                    rapid.publish(helpers.host, "solver-response", {
                        solverID: solver.id,
                        problemID: solver.jobID,
                    });
                }
            }
        });
    }

    /**
     * Returns the given amount of idle solvers, iff there is atleast that amount of solvers idle.
     * @param number amount 
     * @returns Solver[] | undefined
     */
    getIdleSolvers(amount)
    {
        const solvers = this.#solvers
                            .filter(solver => !solver.busy)
                            .filter((_, i) => i < amount);
        if(solvers.length === amount)
        {
            return solvers;
        }
        return false;
    }

    /**
     * Returns the given amount of busy solvers working on the given job.
     * @param number jobID 
     * @returns Solver[]
     */
    getBusySolvers(jobID)
    {
        return this.#solvers.filter(solver => solver.jobID === jobID);
    }
}