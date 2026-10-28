const fs=require('fs'),vm=require('vm'),assert=require('assert');const elements=new Map();function element(id){if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){}},focus(){},showModal(){},close(){},reset(){},dataset:{}});return elements.get(id)}const db=new Map();const ctx={document:{getElementById:element,querySelectorAll:()=>[]},localStorage:{getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,v)},location:{protocol:'file:',hash:''},window:{addEventListener(){},scrollTo(){}},navigator:{},crypto:{randomUUID:()=> 'test-1'},Intl,Date,JSON,Map,Set,Number,String,Math,Array,Error,console,setTimeout:()=>1,clearTimeout(){}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'..','app.js'),'utf8'),ctx);assert(element('list').innerHTML.includes('最初の一歩'));for(const [k,v] of Object.entries({name:'学習',category:'学習',total:'10',unit:'章',done:'4',due:'2026-11-15',next:'次の章を読む'}))element(k).value=v;element('form').onsubmit({preventDefault(){}});assert(JSON.parse(db.get('michi.todos.v1'))[0].done===4);assert(element('summary').innerHTML.includes('40%'));assert(element('list').innerHTML.includes('10章のうち 4章完了'));element('done').value='11';element('form').onsubmit({preventDefault(){}});assert(element('formError').textContent.includes('整数'));assert(JSON.parse(db.get('michi.todos.v1')).length===1);vm.runInContext('render()',ctx);assert(element('list').innerHTML.includes('40%'));console.log('PASS: empty state, Todo creation, persistence, 40% progress, invalid count rejection');


const beforeOverview = db.get('michi.todos.v1');
assert(element('summary').innerHTML.includes('href="#todos"'));
vm.runInContext("filter='done';render()",ctx);
assert(element('list').innerHTML.includes('該当するTodo'));
assert(element('overviewList').innerHTML.includes('学習'));
assert(element('overviewList').innerHTML.includes('10章のうち 4章完了'));
assert(!element('overviewList').innerHTML.includes('<button'));
assert(!element('overviewList').innerHTML.includes('data-action'));
assert.strictEqual(db.get('michi.todos.v1'),beforeOverview);
ctx.location.hash='#todos';vm.runInContext('syncView(false)',ctx);
assert.strictEqual(ctx.document.title,'Todo一覧 — michi.');
ctx.location.hash='';vm.runInContext('syncView(false)',ctx);
assert.strictEqual(ctx.document.title,'michi. — マイTodo');
console.log('PASS: overview link, all records regardless of dashboard filter, no mutation controls, unchanged stored data, route titles');

vm.runInContext(`todos = [
  {id:'a',name:'先の学習',category:'学習',due:'2026-12-01',done:8,total:10,unit:'章',next:''},
  {id:'b',name:'近い学習',category:'学習',due:'2026-11-01',done:1,total:10,unit:'章',next:''},
  {id:'c',name:'暮らしのTodo',category:'暮らし',due:'2026-11-15',done:5,total:10,unit:'件',next:''},
  {id:'d',name:'期限なし',category:'',due:'',done:0,total:10,unit:'件',next:''}
];renderOverview();`,ctx);
function overviewOrder(){return [...element('overviewList').innerHTML.matchAll(/<h2>(.*?)<\/h2>/g)].map(m=>m[1])}
assert.deepStrictEqual(overviewOrder(),['近い学習','暮らしのTodo','先の学習','期限なし']);
element('overviewCategory').onchange({target:{value:'category:学習'}});
assert.deepStrictEqual(overviewOrder(),['近い学習','先の学習']);
assert(element('overviewCount').textContent.includes('2 / 4件'));
element('overviewSort').onchange({target:{value:'progress-desc'}});
assert.deepStrictEqual(overviewOrder(),['先の学習','近い学習']);
element('overviewCategory').onchange({target:{value:'all'}});
element('overviewSort').onchange({target:{value:'due-desc'}});
assert.deepStrictEqual(overviewOrder(),['先の学習','暮らしのTodo','近い学習','期限なし']);
element('overviewSort').onchange({target:{value:'progress-asc'}});
assert.deepStrictEqual(overviewOrder(),['期限なし','近い学習','暮らしのTodo','先の学習']);
element('overviewCategory').onchange({target:{value:'category:'}});
assert.deepStrictEqual(overviewOrder(),['期限なし']);
assert(!element('overviewList').innerHTML.includes('<button'));
assert.strictEqual(db.get('michi.todos.v1'),beforeOverview);
console.log('PASS: category/uncategorized filters, four sort directions, no-deadline placement, counts and unchanged storage');
