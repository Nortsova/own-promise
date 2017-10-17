const PENDING = 'PENDING';
const RESOLVED = 'RESOLVED';
const REJECTED = 'REJECTED';


class DevPromise {
  constructor(func){
    // return func(this.resolve, this.reject);

    this.status = PENDING;
    this.value = null;
    this.errorValue = null;
    this.resolutionQueue = [];
    this.errorQueue = [];

    this.calledBy = null;
    
    if (typeof func !== 'function') {
      throw TypeError();
    }

    try {
      func(this._resolve.bind(this), this.reject.bind(this));
    } catch (e) {
        this.reject(e);
    }
  }

  static resolve(value) {

    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError();
    }
    if(value instanceof DevPromise) {
      return value;
    }
    const newPromise = new DevPromise((resolve)=> {resolve(value)});
    return newPromise;

  }
  static reject(error) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError();
    }
    const newPromise = new DevPromise((resolve, reject)=> {reject(error)});
    return newPromise;

  }

  static race (array) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError();
    }
    if (typeof array[Symbol.iterator] !== 'function') {
      const newPromise = new DevPromise((resolve, reject)=> {reject(TypeError())});
      return newPromise;
   }

      const newPromise = new DevPromise((resolve,reject)=> {

        
        const res = array.map(item => item.then((value)=> {
               res.push(value);
            }, (error) => {
              reject(error);
            }));
         resolve(res);
        });

        if (array.length <1) {
          newPromise.calledBy = 'race';
        }
       return newPromise;
  }

  static all (array) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError();
    }
    if (typeof array[Symbol.iterator] !== 'function') {
      const newPromise = new DevPromise((resolve, reject)=> reject(TypeError()));
      return newPromise;
   }
   if(!Array.isArray(array)) return new DevPromise((res,rej) => rej(TypeError()));
   
   const resultArray = [];

    
    const newPromise = new DevPromise((resolve, reject) => {
      for (let i = 0; i < array.length; i += 1) {
        const item = array[i];
        if (item.status === REJECTED) {
          item.catch(error => reject(error));
        }
        if (item.status === PENDING) {
          setTimeout(()=> {

            item.then(value => resultArray.push(value)).catch(error => {DevPromise.reject(new Error())});
          },0);
        }
        if(item instanceof DevPromise) {
          item.then(value => resultArray.push(value));
        } else {
  
          resultArray.push(item);
        }
      }

      resolve(resultArray);
    });
   return  newPromise.then(data => data);
  }

  runQueue(queue) {
    while(this.queue.length > 0) {
      const resolution = this.queue.shift();
        try {
          const returnedValue = resolution.handler(this.value);
          if (returnedValue && returnedValue instanceof DevPromise) {
            returnedValue
            .then((value)=> {
              resolution.promise._resolve(value);
            })
            .catch((error)=> {
              resolution.promise.reject(error);
            });
          }
          else {
            resolution.promise._resolve(returnedValue);
          }
        } catch(error) {
          resolution.promise.reject(error);
        }
    }
  }
  runResolutionQueue() {
    while(this.resolutionQueue.length > 0) {
      const resolution = this.resolutionQueue.shift();
      setTimeout(()=> {
        try {
          const returnedValue = resolution.handler(this.value);
          if (returnedValue && returnedValue instanceof DevPromise) {
            returnedValue
            .then((value)=> {
              resolution.promise._resolve(value);
            })
            .catch((error)=> {
              resolution.promise.reject(error);
            });
          }
          else {
            resolution.promise._resolve(returnedValue);
          }
        } catch(error) {
          resolution.promise.reject(error);
        }
      },0);
    }
  }
  runRejectionQueue() {
    while(this.errorQueue.length > 0) {
      const rejection = this.errorQueue.shift();
      setTimeout(()=> {
        try {
          const returnedValue = rejection.handler(this.errorValue);
          if (returnedValue && returnedValue instanceof DevPromise) {
            returnedValue
            .then((value)=> {
              rejection.promise._resolve(value);
            })
            .catch((error)=> {
              rejection.promise.reject(error);
            });
          }
          else {
            rejection.promise._resolve(returnedValue);
          }
        } catch(error) {
          rejection.promise.reject(error);
        }
      },0);
    }
  }
  _resolve(value) {
    if (this.status === PENDING) {
      this.value = value;
      this.status = RESOLVED;

      this.runResolutionQueue();
    }
  }
  reject(error) {
    if (this.status === PENDING) {
      this.errorValue = error;
      this.status = REJECTED;

      this.runRejectionQueue();

      while (this.resolutionQueue > 0) {
        const resolution = this.resolutionQueue.shift();

        resolution.promise.reject(this.errorValue);
      }
    }
  }

  then(resolutionHandler, rejectionHandler) {
    if (arguments.length < 1) {
      return this;

    }
    const newPromise = new DevPromise(()=> {});

    if (typeof resolutionHandler === 'function' ){
      this.resolutionQueue.push({
        handler: resolutionHandler.bind(undefined),
        promise: newPromise
      });
    }
    if (typeof rejectionHandler === 'function' ){
      this.errorQueue.push({
        handler: rejectionHandler.bind(undefined),
        promise: newPromise
      });
    }
    if (this.calledBy === 'race') {
      return newPromise;
    }
    if(this.status === RESOLVED) {
      this.queue(this.resolutionQueue);
    }
    if(this.status === REJECTED) {
      if (!rejectionHandler) {
        return this;
      }
      this.runRejectionQueue(this.errorQueue);
    }
    return newPromise;
  }

  catch(rejectionHandler) {
    return this.then(null, rejectionHandler);
  }
}




module.exports =  DevPromise; // change to devPromise;


