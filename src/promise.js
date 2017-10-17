const PENDING = 'PENDING';
const RESOLVED = 'RESOLVED';
const REJECTED = 'REJECTED';


class DevPromise {
  constructor(func){
    this.status = PENDING;
    this.value = null;
    this._callbacks = [];
    this.settled = false;

    if (typeof func !== 'function') {
      throw TypeError();
    }
    try {
      func(this._resolve.bind(this), this._reject.bind(this));
    } catch (e) {
        this._reject(e);
    }
  }
  static resolve(value) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError();
    }
    if (value instanceof DevPromise) {
      return value;
    }
    return new DevPromise(resolve => resolve(value));
  }
  static reject(value) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError();
    }
    return new DevPromise((resolve,reject) => reject(value));
  }
  static all(array) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError();
    }
    if (typeof array[Symbol.iterator] !== 'function') {
      const newPromise = new DevPromise((resolve, reject)=> {reject(TypeError())});
      return newPromise;
   }
   let resArray = [];
   const resultPromise = array.reduce((prev,current) => {
     return prev.then(()=> current).then(data => resArray.push(data));
   }, new DevPromise((resolve)=> resolve([])));
    return resultPromise.then(()=>resArray);
  }


  static race(array) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError();
    }
    if (typeof array[Symbol.iterator] !== 'function') {
      const newPromise = new DevPromise((resolve, reject)=> {reject(TypeError())});
      return newPromise;
   }
   return new DevPromise((resolve, reject) => {
     array.forEach(item => item.then(resolve,reject));
   });
  }


  static sequence(array) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError();
    }
    if (typeof array[Symbol.iterator] !== 'function') {
      const newPromise = new DevPromise((resolve, reject)=> {reject(TypeError())});
      return newPromise;
   }
   return array.reduce((prev,current) => {
     return prev.then(()=> current());
   }, new DevPromise((resolve)=> resolve()));
   
  }

  _resolve(value) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError();
    }
    if (this.status !== PENDING) return;
    this.status = RESOLVED;
    if (value instanceof DevPromise) {
      value.done((val)=> this._settle(val), (error)=> {
        this.status = REJECTED;
        this._settle(error);
      });
    }
    else {
      this._settle(value);
    }
  }
  _reject(value){
    if (this.status !== PENDING) return;
    this.status = REJECTED;
    this._settle(value);
  }

  _realise(onResolve, onReject) {
    if(this.status === REJECTED) {
      if(typeof onReject !== 'function') {throw this._value}
      else {onReject(this.value)}
    }
    else if(typeof onResolve !== 'function') {throw this._value}
      else {onResolve(this.value)}
  }
  _settle(value) {
    this.settled = true;
    this.value = value;
    setTimeout(()=> {
      this._callbacks.forEach(item=> {
        this._realise(item.onResolve, item.onReject);
      });
    },0);
  }
  done(onResolve, onReject) {
    if(this.settled) {
      setTimeout(()=> this._realise(onResolve, onReject),0);
    }
    else {
      this._callbacks.push({onResolve, onReject});
    }
  }

  then(onResolve, onReject) {
    if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
      throw TypeError();
    }
    return new DevPromise((resolve, reject)=>{
      this.done(value => {
        if (typeof onResolve === 'function' || typeof onResolve === 'object') {
          try {
            value = onResolve(value);
          } catch(e) {
            reject(e);
          }
          resolve(value);
        }
      }, error =>{
        if(typeof onReject === 'function') {
          try {
            error = onReject(error);
          } catch(e) {
            reject(e);
          }
          resolve(error);
        }
        reject(error);
      });
    });
  }
  catch(onReject) {
     return this.then(null,onReject);
  }
}


module.exports =  DevPromise; // change to devPromise;


