require 'sinatra/base'
require 'json'
class Product < Sinatra::Base
 set :host_authorization, { permitted_hosts: [] }
 def count(add)
  path=File.join(ENV.fetch('PODS_APP_DATA','/data'),'count')
  File.open(path, File::RDWR|File::CREAT,0600) do |f|
   f.flock(File::LOCK_EX);n=f.read.to_i
   if add then n+=1;f.rewind;f.truncate(0);f.write(n.to_s) end
   n
  end
 end
 get('/') { "<!doctype html><html><title>Sinatra counter</title><h1>Sinatra counter</h1><p id=\"value\"></p><button id=\"add\">Add one</button><script>async function refresh(){document.querySelector(\"#value\").textContent=(await(await fetch(\"/api/count\")).json()).count}document.querySelector(\"#add\").onclick=async()=>{await fetch(\"/api/count\",{method:\"POST\"});refresh()};refresh()</script></html>" }
 get('/api/count') {content_type :json;{count:count(false)}.to_json}
 post('/api/count') {content_type :json;{count:count(true)}.to_json}
end
