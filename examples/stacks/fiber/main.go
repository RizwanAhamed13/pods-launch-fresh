package main
import("os";"path/filepath";"strconv";"sync";"github.com/gofiber/fiber/v3")
var mu sync.Mutex
const page=`<!doctype html><html><title>Fiber counter</title><h1>Fiber counter</h1><p id="value"></p><button id="add">Add one</button><script>async function refresh(){document.querySelector('#value').textContent=(await(await fetch('/api/count')).json()).count}document.querySelector('#add').onclick=async()=>{await fetch('/api/count',{method:'POST'});await refresh()};refresh()</script></html>`
func count(add bool) map[string]int { mu.Lock(); defer mu.Unlock(); p:=filepath.Join(os.Getenv("PODS_APP_DATA"),"count"); b,_:=os.ReadFile(p); n,_:=strconv.Atoi(string(b)); if add {n++; if err:=os.WriteFile(p,[]byte(strconv.Itoa(n)),0600);err!=nil{panic(err)}};return map[string]int{"count":n} }
func main(){r:=fiber.New();r.Get("/",func(c fiber.Ctx)error{c.Type("html");return c.SendString(page)});r.Get("/api/count",func(c fiber.Ctx)error{return c.JSON(count(false))});r.Post("/api/count",func(c fiber.Ctx)error{return c.JSON(count(true))});if err:=r.Listen(":8080");err!=nil{panic(err)}}
