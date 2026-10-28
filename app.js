'use strict';
const $=id=>document.getElementById(id),KEY='michi.todos.v1';let storageBlocked=false;let todos=[],filter='all',current=null,pending=[],timer;const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const percent=t=>Math.round(t.done/t.total*100);function valid(t){return t&&typeof t.id==='string'&&t.id.length<=100&&typeof t.name==='string'&&t.name.trim().length>0&&t.name.length<=100&&typeof t.category==='string'&&t.category.length<=40&&typeof t.unit==='string'&&t.unit.trim().length>0&&t.unit.length<=12&&typeof t.next==='string'&&t.next.length<=2000&&Number.isInteger(t.total)&&t.total>0&&t.total<=1000000&&Number.isInteger(t.done)&&t.done>=0&&t.done<=t.total&&typeof t.due==='string'&&(!t.due||(/^\d{4}-\d{2}-\d{2}$/.test(t.due)&&!isNaN(Date.parse(t.due))))}function clean(t){return {id:t.id,name:t.name,category:t.category,unit:t.unit,next:t.next,total:t.total,done:t.done,due:t.due}}function notify(s){$('toast').textContent=s;$('toast').classList.remove('hidden');clearTimeout(timer);timer=setTimeout(()=>$('toast').classList.add('hidden'),3000)}function persist(){if(storageBlocked)return false;try{localStorage.setItem(KEY,JSON.stringify(todos));$('storageWarning').classList.add('hidden');return true}catch{$('storageWarning').classList.remove('hidden');return false}}try{const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(!Array.isArray(parsed)||!parsed.every(valid))throw Error();todos=parsed.map(clean)}}catch{storageBlocked=true;$('storageWarning').classList.remove('hidden');$('storageWarning').textContent='保存データを読み込めませんでした。既存データ保護のため、このページを閉じる前に状況を確認してください。';$('add').disabled=true;}
function render(){const active=todos.filter(t=>t.done<t.total),near=active.filter(t=>t.due).map(t=>t.due).sort()[0];const overall=todos.length?Math.round(todos.reduce((n,t)=>n+t.done/t.total,0)/todos.length*100):0;$('date').textContent=new Intl.DateTimeFormat('ja-JP',{month:'long',day:'numeric',weekday:'long'}).format(new Date());$('summary').innerHTML=`<a class="hero" href="#todos" aria-label="作成したTodoの一覧を見る"><div><div class="tag">TOTAL PROGRESS</div><h2>着実に、前へ。</h2><p>${todos.filter(t=>t.done===t.total).length} / ${todos.length} 件のTodoが完了</p><p>各Todoの達成率の平均</p><p class="hero-link">Todo一覧を見る →</p></div><div class="ring" style="--angle:${overall*3.6}deg"><b>${overall}%</b><small>全体の進捗</small></div></a><div class="tiles"><div class="tile"><b>${active.length}</b><small>進行中のTodo</small></div><div class="tile"><b>${near?esc(near.slice(5).replace('-','/')):'—'}</b><small>いちばん近い期限</small></div></div>`;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.filter===filter));const shown=todos.filter(t=>filter==='all'||(filter==='done'?t.done===t.total:t.done<t.total)).sort((a,b)=>(a.done===a.total)-(b.done===b.total)||(a.due||'9999').localeCompare(b.due||'9999'));$('list').innerHTML=shown.length?shown.map(t=>`<article class="card"><div class="tag">${esc(t.category||'MY TODO')}${t.due?' · '+esc(t.due.replaceAll('-','/'))+' まで':''}${t.done===t.total?' · 完了':''}</div><div class="row"><h2>${esc(t.name)}</h2><div class="pct">${percent(t)}%</div></div><div class="track" role="progressbar" aria-label="${esc(t.name)}の進捗" aria-valuenow="${percent(t)}" aria-valuemin="0" aria-valuemax="100"><div class="fill" style="width:${percent(t)}%"></div></div><div class="detail">${t.total}${esc(t.unit)}のうち ${t.done}${esc(t.unit)}完了</div>${t.next?`<div class="next">${t.done===t.total?'メモ：':'次 → '}${esc(t.next)}</div>`:''}<div class="actions"><button data-id="${esc(t.id)}" data-action="progress">進捗を記録</button><button class="light" data-id="${esc(t.id)}" data-action="edit">編集</button><button class="light" data-id="${esc(t.id)}" data-action="delete">削除</button></div></article>`).join(''):'<div class="empty">'+(todos.length?'該当するTodoはありません。':'最初の一歩を、ここから。<br>「＋ Todoを追加」で始めましょう。')+'</div>';renderOverview();syncView(false)}

// These display preferences do not change the saved Todo records.
let overviewCategory = 'all';
let overviewSort = 'due-asc';

function compareOverview(a, b) {
  const nameOrder = a.name.localeCompare(b.name, 'ja');
  if (overviewSort.startsWith('progress-')) {
    const difference = a.done / a.total - b.done / b.total;
    return (overviewSort === 'progress-desc' ? -difference : difference) || nameOrder;
  }
  // Undated items always appear last, in either direction.
  if (!a.due || !b.due) return a.due ? -1 : b.due ? 1 : nameOrder;
  const difference = a.due.localeCompare(b.due);
  return (overviewSort === 'due-desc' ? -difference : difference) || nameOrder;
}

function renderOverview() {
  const categories = [...new Set(todos.map(todo => todo.category))].sort((a, b) =>
    a === '' ? 1 : b === '' ? -1 : a.localeCompare(b, 'ja')
  );
  if (overviewCategory !== 'all' && !categories.some(category => 'category:' + category === overviewCategory)) {
    overviewCategory = 'all';
  }
  $('overviewCategory').innerHTML = '<option value="all">すべてのカテゴリ</option>' + categories.map(category =>
    `<option value="${esc('category:' + category)}">${esc(category || '未分類')}</option>`
  ).join('');
  $('overviewCategory').value = overviewCategory;
  $('overviewSort').value = overviewSort;
  const items = todos.filter(todo => overviewCategory === 'all' || 'category:' + todo.category === overviewCategory).sort(compareOverview);
  const completed = items.filter(todo => todo.done === todo.total).length;
  $('overviewCount').textContent = `${items.length} / ${todos.length}件を表示 · 進行中 ${items.length - completed}件 · 完了 ${completed}件`;
  $('overviewList').innerHTML = items.length ? items.map(todo => `
    <article class="card">
      <div class="tag">${esc(todo.category || '未分類')} · ${todo.done === todo.total ? '完了' : todo.done === 0 ? '未着手' : '進行中'}${todo.due ? ' · ' + esc(todo.due.replaceAll('-', '/')) + ' まで' : ' · 期限なし'}</div>
      <div class="row"><h2>${esc(todo.name)}</h2><div class="pct">${percent(todo)}%</div></div>
      <div class="track" role="progressbar" aria-label="${esc(todo.name)}の進捗" aria-valuenow="${percent(todo)}" aria-valuemin="0" aria-valuemax="100"><div class="fill" style="width:${percent(todo)}%"></div></div>
      <div class="detail">${todo.total}${esc(todo.unit)}のうち ${todo.done}${esc(todo.unit)}完了</div>
      ${todo.next ? `<div class="next">${todo.done === todo.total ? 'メモ：' : '次 → '}${esc(todo.next)}</div>` : ''}
    </article>`).join('') : '<div class="empty">' + (todos.length ? 'このカテゴリのTodoはありません。' : 'まだTodoがありません。<br>ダッシュボードからTodoを追加できます。') + '</div>';
}

$('overviewCategory').onchange = event => {
  overviewCategory = event.target.value;
  renderOverview();
};
$('overviewSort').onchange = event => {
  overviewSort = event.target.value;
  renderOverview();
};

function syncView(focusHeading = true) {
  const isOverview = location.hash === '#todos';
  $('dashboardView').classList.toggle('hidden', isOverview);
  $('overviewView').classList.toggle('hidden', !isOverview);
  document.title = isOverview ? 'Todo一覧 — michi.' : 'michi. — マイTodo';
  if (isOverview && focusHeading) $('overviewTitle').focus();
}

window.addEventListener('hashchange', () => {
  renderOverview();
  syncView();
  window.scrollTo(0, 0);
});

function openEdit(t){current=t?.id||null;$('form').reset();$('formTitle').textContent=t?'Todoを編集':'Todoを追加';for(const k of ['name','category','total','unit','done','due','next'])if(t)$(k).value=t[k];$('formError').textContent='';$('editDialog').showModal()}$('add').onclick=()=>openEdit();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;render()});$('form').onsubmit=e=>{e.preventDefault();const t={id:current||(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random()),name:$('name').value.trim(),category:$('category').value.trim(),unit:$('unit').value.trim(),total:Number($('total').value),done:Number($('done').value),due:$('due').value,next:$('next').value.trim()};if(!valid(t)){$('formError').textContent='Todo名・単位を入力し、完了数を0から目標数までの整数にしてください。';return}const index=todos.findIndex(x=>x.id===current);if(index<0)todos.push(t);else todos[index]=t;const saved=persist();$('editDialog').close();render();notify(saved?'保存しました':'保存できません。バックアップを書き出してください')};$('list').onclick=e=>{const b=e.target.closest('button[data-action]');if(!b)return;const t=todos.find(t=>t.id===b.dataset.id);if(!t)return;current=t.id;if(b.dataset.action==='edit'){openEdit(t);return}if(b.dataset.action==='delete'){$('deleteName').textContent=t.name;$('deleteDialog').showModal();return}$('progressTitle').textContent=t.name;$('progress').max=t.total;$('progress').value=t.done;$('progressNote').value=t.next;progressText();$('progressDialog').showModal()};function progressText(){const t=todos.find(t=>t.id===current);$('progressText').textContent=$('progress').value+' / '+t.total+t.unit+' 完了（'+Math.round(Number($('progress').value)/t.total*100)+'%）'}$('progress').oninput=progressText;$('record').onclick=()=>{const t=todos.find(t=>t.id===current);t.done=Number($('progress').value);t.next=$('progressNote').value.trim();const saved=persist();$('progressDialog').close();render();notify(saved?'進捗を記録しました':'保存できません。バックアップを書き出してください')};$('deleteConfirm').onclick=()=>{todos=todos.filter(t=>t.id!==current);const saved=persist();$('deleteDialog').close();render();notify(saved?'削除しました':'保存できません。再読み込みすると元に戻ります')};$('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,todos},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='michi-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)};$('import').onclick=()=>$('file').click();$('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;try{if(file.size>5000000)throw Error();const data=JSON.parse(await file.text());if(data.version!==1||!Array.isArray(data.todos)||data.todos.length>5000||!data.todos.every(valid)||new Set(data.todos.map(t=>t.id)).size!==data.todos.length)throw Error();pending=data.todos.map(clean);$('importInfo').textContent=pending.length+'件のTodoを読み込みます。';$('importDialog').showModal()}catch{notify('有効なmichi.バックアップを選んでください')}$('file').value=''};$('importConfirm').onclick=()=>{const map=new Map(todos.map(t=>[t.id,t]));pending.forEach(t=>map.set(t.id,t));todos=[...map.values()];const saved=persist();$('importDialog').close();render();notify(saved?'バックアップを読み込みました':'保存できません。バックアップを書き出してください')};$('install').textContent=location.protocol==='file:'?'ホーム画面への追加・オフライン利用にはHTTPSでの公開が必要です。':'iPhoneのSafariで共有メニュー →「ホーム画面に追加」から利用できます。';if('serviceWorker' in navigator&&['https:','http:'].includes(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{ $('install').textContent+=' オフライン機能を有効にできませんでした。';});render();


