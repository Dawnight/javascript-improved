function MVVM(options = {}){
  // 将所有属性挂载在 $options 上
  this.$options = options;
  let data = this._data = this.$options.data;
  // 数据劫持
  observe(data);
  // this 代理了 this._data 属性
  for (let key in data) {
   if (data.hasOwnProperty(key)) {
     Object.defineProperty(this, key, {
       enumerable: true,
       get () {
         return this._data[key];
       },
       set (newValue) {
         this._data[key] = newValue;
       }
     });
   }
  }
  // 数据编译
  new Compile(options.el, this)
}

// 这里是主要的逻辑
function Observe(data){
  let dep = new Dep();
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      let value = data[key];
      console.log('value: ', value);
      observe(value);
      // observe(value);
      // 把 data 属性通过 Object.defineProperty 方式定义属性
      Object.defineProperty(data, key, {
        enumerable: true,
        get () {
          Dep.target && dep.addSub(Dep.target); // [watcher]
          return value;
        },
        // 更改值的时候
        set (newValue) {
          // 这两个值一样
          if (newValue === value) {
            return;
          }
          value = newValue;
          observe(value);
          // 让所有的 watcher 的 update 方法执行即可
          dep.notify();
        }
      })
    }
  }
}

// 观察对象给对象增加 Object.defineProperty
function observe(data) {
  if (typeof data !== 'object' && data !== null) {
    return new Observe(data)
  }
}

// vue 的特点是不能新增不存在的属性，不存在的属性没有 get 和 set
// 深度响应，因为每次赋予一个新对象时会给这个新对象增加数据劫持

function Compile (el, vm) {
  // el 表示替换的范围
  vm.$el = document.querySelector(el);
  let fragment = document.createDocumentFragment()
  // 将 app 中的内容移入内存中
  while(child = vm.$el.firstChild) {
    fragment.appendChild(child);
  }
  replace(fragment);
  function replace (fragment) {
    Array.from(fragment.childNodes).forEach(node => {
      let text = node.textContent;
      let reg = /\{\{(.*)\}\}/;
      if (node.nodeType === 3 && reg.test(text)) {
        console.log(RegExp.$1);         // user.name
        let arr = RegExp.$1.split('.'); // [user, name]
        let value = vm;
        arr.forEach(k => {              // this.user.name
          value = value[k];
        });
        // 函数里需要接收一个新值
        new Watcher(vm, RegExp.$1, function (newValue) {
          node.textContent = text.replace(/\{\{(.*)\}\}/, value);
        });



        // 替换的逻辑
        node.textContent = text.replace(/\{\{(.*)\}\}/, value);
      }
      if (node.childNodes) {
        replace(node);
      }
    });
  }
  // 再把内存中的内容放到页面上
  vm.$el.appendChild(fragment);
}

// 发布订阅
function Dep() {
  this.subs = [];
}

Dep.prototype.addSub = function (sub) {
  this.subs.push(sub);
};

Dep.prototype.notify = function () {
  this.subs.forEach(sub => sub.update());
};

// watcher 是一个类，通过这个类创建的实例都拥有 update 方法
function Watcher(vm, exp, fn) {
  // 添加到订阅中
  this.fn = fn;
  this.vm = vm;
  this.exp = exp;
  Dep.target = this;
  let value = vm;
  let arr = exp.split('.');
  arr.forEach(k => {
    value = value[k];
  });
  Dep.target = null;
}

Watcher.prototype.update = function () {
  Dep.target = this;
  let value = this.vm;
  let arr = this.exp.split('.');
  arr.forEach(k => {
    value = value[k];
  });
  this.fn(value);
};




