import rapid from '@ovcina/rapidriver';
import RiverSubscription from './RiverSubscription.js';
import uid from 'uid-safe';

export default class RapidManager {

  #host;
  #subscriptions;

  constructor(host) {
    this.#host = host;
    this.#subscriptions = {};
  }

  /**
   * Automaticly logs responses.
   */
  #log(callback, userId)
  {
    return data => {
      data.userId = userId;
      rapid.publish(this.#host, "logIt", data);
      callback(data);
    };
  }

  async publishAndSubscribe(event, callbackEvent, sessionId, data, callback, userId) {
    if (!(callbackEvent in this.#subscriptions)) {
      this.#subscriptions[callbackEvent] = new RiverSubscription(this.#host, 'gateway', callbackEvent);
    }
    const subscription = this.#subscriptions[callbackEvent];

    // Generate a random request ID to differentiate incoming answers and add it to the data body.
    const requestId = await uid(18);

    subscription.addCallback(sessionId, requestId, this.#log(callback, userId));

    // Add session ID and request ID to data before we publish it.
    data.sessionId = sessionId;
    data.requestId = requestId;

    rapid.publish(this.#host, event, data);
  }
}
