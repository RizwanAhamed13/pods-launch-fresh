use std::{fs,path::PathBuf,sync::Mutex};static LOCK:Mutex<()>=Mutex::new(());
fn value(add:bool)->i64 {let _g=LOCK.lock().unwrap();let p=PathBuf::from(std::env::var("PODS_APP_DATA").unwrap_or("/data".into())).join("count");let mut n=fs::read_to_string(&p).unwrap_or_default().parse::<i64>().unwrap_or(0);if add{n+=1;fs::write(p,n.to_string()).unwrap();}n}
const PAGE:&str=r##"<!doctype html><html><title>Rocket counter</title><h1>Rocket counter</h1><p id="value"></p><button id="add">Add one</button><script>async function refresh(){document.querySelector('#value').textContent=(await(await fetch('/api/count')).json()).count}document.querySelector('#add').onclick=async()=>{await fetch('/api/count',{method:'POST'});await refresh()};refresh()</script></html>"##;
#[macro_use]extern crate rocket;use rocket::response::content::RawHtml;use rocket::serde::json::{Json,json,Value};
#[get("/")]fn home()->RawHtml<&'static str>{RawHtml(PAGE)}
#[get("/api/count")]fn read()->Json<Value>{Json(json!({"count":value(false)}))}
#[post("/api/count")]fn add()->Json<Value>{Json(json!({"count":value(true)}))}
#[launch]fn rocket()->_ {rocket::custom(rocket::Config::figment().merge(("address","0.0.0.0")).merge(("port",8080))).mount("/",routes![home,read,add])}
