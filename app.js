const state={products:[],cart:new Map(),query:""};
const $=s=>document.querySelector(s);
const money=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});

function parseCSV(text){
  const rows=[];let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&quoted&&n==='"'){cell+='"';i++;}else if(c==='"'){quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell="";}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell="";}else cell+=c;}
  if(cell||row.length){row.push(cell);rows.push(row)}
  if(rows.length<2)return[];const headers=rows[0].map(h=>h.trim().toLowerCase());
  return rows.slice(1).map((r,i)=>{const o={};headers.forEach((h,j)=>o[h]=r[j]?.trim()||"");return{id:o.part_number||o.part||`item-${i}`,partNumber:o.part_number||o.part||"",description:o.description||o.product||"WIX Filter",price:Number(String(o.sell_price||o.price||0).replace(/[$,]/g,""))||0,image:o.image||o.image_url||""}}).filter(p=>p.partNumber);
}

async function loadCatalog(){
  try{const res=await fetch("data/products.csv",{cache:"no-store"});if(!res.ok)throw new Error();state.products=parseCSV(await res.text());}
  catch{state.products=[]}
  if(!state.products.length){const n=$("#catalogNotice");n.hidden=false;n.innerHTML="The product catalog is ready to accept the WIX price list. Add rows to <strong>data/products.csv</strong> using the included columns; products and SELL PRICE values will appear here automatically."}
  renderProducts();
}

function renderProducts(){const q=state.query.trim().toLowerCase();const items=state.products.filter(p=>!q||`${p.partNumber} ${p.description}`.toLowerCase().includes(q));$("#resultCount").textContent=`${items.length} product${items.length===1?"":"s"}`;$("#productGrid").innerHTML=items.length?items.map(productCard).join(""):`<div class="no-results"><h3>No matching filters</h3><p>Try another part number or description.</p></div>`}
function productCard(p){const safe=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));return `<article class="product-card"><div class="product-image">${p.image?`<img src="${safe(p.image)}" alt="WIX ${safe(p.partNumber)}" loading="lazy">`:"WIX"}</div><h3 class="part-number">${safe(p.partNumber)}</h3><p class="description">${safe(p.description)}</p><div class="card-bottom"><span class="price"><small>SELL PRICE</small><strong>${money.format(p.price)}</strong></span><span class="qty-control"><button type="button" data-step="-1" data-id="${safe(p.id)}" aria-label="Decrease quantity">−</button><input id="qty-${safe(p.id)}" value="1" inputmode="numeric" aria-label="Quantity"><button type="button" data-step="1" data-id="${safe(p.id)}" aria-label="Increase quantity">+</button></span></div><button class="add-button" type="button" data-add="${safe(p.id)}">Add to order</button></article>`}

function updateQty(id,step){const input=document.getElementById(`qty-${id}`);input.value=Math.max(1,Math.min(999,(parseInt(input.value)||1)+step))}
function addToCart(id){const p=state.products.find(x=>x.id===id),input=document.getElementById(`qty-${id}`);if(!p)return;const qty=Math.max(1,parseInt(input.value)||1);state.cart.set(id,{...p,qty:(state.cart.get(id)?.qty||0)+qty});saveCart();renderCart();openCart()}
function renderCart(){const items=[...state.cart.values()];$("#cartCount").textContent=items.reduce((n,x)=>n+x.qty,0);$("#cartItems").innerHTML=items.length?items.map(x=>`<div class="cart-line"><strong>${x.partNumber} × ${x.qty}</strong><small>${x.description}<br>${money.format(x.price)} each · ${money.format(x.price*x.qty)}</small><button class="remove-button" type="button" data-remove="${x.id}" aria-label="Remove ${x.partNumber}">Remove</button></div>`).join(""):`<div class="empty-cart">Your order is empty.</div>`;$("#cartTotal").textContent=money.format(items.reduce((n,x)=>n+x.price*x.qty,0));}
function saveCart(){localStorage.setItem("iqp-order-cart",JSON.stringify([...state.cart]));}
function restoreCart(){try{state.cart=new Map(JSON.parse(localStorage.getItem("iqp-order-cart"))||[])}catch{state.cart=new Map()}renderCart()}
function openCart(){const d=$("#cartDrawer");d.classList.add("open");d.setAttribute("aria-hidden","false");$("#cartButton").setAttribute("aria-expanded","true");$("#scrim").hidden=false;$("#closeCart").focus()}
function closeCart(){const d=$("#cartDrawer");d.classList.remove("open");d.setAttribute("aria-hidden","true");$("#cartButton").setAttribute("aria-expanded","false");$("#scrim").hidden=true}

$("#searchInput").addEventListener("input",e=>{state.query=e.target.value;renderProducts()});
$("#productGrid").addEventListener("click",e=>{const step=e.target.closest("[data-step]"),add=e.target.closest("[data-add]");if(step)updateQty(step.dataset.id,Number(step.dataset.step));if(add)addToCart(add.dataset.add)});
$("#cartItems").addEventListener("click",e=>{const b=e.target.closest("[data-remove]");if(b){state.cart.delete(b.dataset.remove);saveCart();renderCart()}});
$("#cartButton").addEventListener("click",openCart);$("#closeCart").addEventListener("click",closeCart);$("#scrim").addEventListener("click",closeCart);document.addEventListener("keydown",e=>{if(e.key==="Escape")closeCart()});
$("#customerForm").addEventListener("submit",e=>{e.preventDefault();if(!state.cart.size){alert("Add at least one product before saving the order.");return}document.title=`IQP Order - ${new FormData(e.target).get("company")}`;window.print()});
restoreCart();loadCatalog();if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
