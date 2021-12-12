import rapid from '@ovcina/rapidriver';

export default class RiverSubscription {

  _callbacks;

  constructor(host, river, event) {
    this._callbacks = {};

    console.log(`Creating RiverSubscription with host: ${host}, river: ${river}, event: ${event}`);
    // Create subscription to river.
    rapid.subscribe(host, [{
      river: river, event: event, work: res => {
        console.log(`Received: ${JSON.stringify(res)}`);
        const msg = res;

        if (msg.sessionId in this._callbacks && msg.requestId in this._callbacks[msg.sessionId]) {
          // Execute the callback for the session.
          this._callbacks[msg.sessionId][msg.requestId](res);

          // Delete from the callbacks as this one is executed now.
          delete this._callbacks[msg.sessionId][msg.requestId];
        } else {
          console.warn(`No known callback function for session ID ${msg.sessionId}, request ID ${msg.requestId} and event ${event}.`);
        }
      }
    }]);
  }

  /**
   * Add callback function for certain session to the river subscription.
   * @param sessionId - Session ID.
   * @param requestId - Request ID.
   * @param callback - Callback function to execute.
   */
  addCallback(sessionId, requestId, callback) {
    if (!(sessionId in this._callbacks)) {
      this._callbacks[sessionId] = {};
    }
    this._callbacks[sessionId][requestId] = callback;
  }
}
