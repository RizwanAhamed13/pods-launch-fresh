use std::{fs,path::PathBuf,sync::Mutex};static LOCK:Mutex<()>=Mutex::new(());
fn value(add:bool)->i64 {let _g=LOCK.lock().unwrap();let p=PathBuf::from(std::env::var("PODS_APP_DATA").unwrap_or("/data".into())).join("count");let mut n=fs::read_to_string(&p).unwrap_or_default().parse::<i64>().unwrap_or(0);if add{n+=1;fs::write(p,n.to_string()).unwrap();}n}
const PAGE:&str=r##"<!doctype html><html><title>Actix counter</title><h1>Actix counter</h1><p id="value"></p><button id="add">Add one</button><script>async function refresh(){document.querySelector('#value').textContent=(await(await fetch('/api/count')).json()).count}document.querySelector('#add').onclick=async()=>{await fetch('/api/count',{method:'POST'});await refresh()};refresh()</script></html>"##;
use actix_web::{web,App,HttpResponse,HttpServer};
async fn home()->HttpResponse {HttpResponse::Ok().content_type("text/html").body(PAGE)}
async fn read()->HttpResponse {HttpResponse::Ok().json(serde_json::json!({"count":value(false)}))}
async fn add()->HttpResponse {HttpResponse::Ok().json(serde_json::json!({"count":value(true)}))}
#[actix_web::main]async fn main()->std::io::Result<()> {HttpServer::new(||App::new().route("/",web::get().to(home)).route("/api/count",web::get().to(read)).route("/api/count",web::post().to(add))).bind(("0.0.0.0",8080))?.run().await}
