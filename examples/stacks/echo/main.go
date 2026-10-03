package main
import("os";"path/filepath";"strconv";"sync";"github.com/labstack/echo/v5")
var mu sync.Mutex
const page=`<!doctype html><html><title>Echo counter</title><h1>Echo counter</h1><p id="value"></p><button id="add">Add one</button><script>async function refresh(){document.querySelector('#value').textContent=(await(await fetch('/api/count')).json()).count}document.querySelector('#add').onclick=async()=>{await fetch('/api/count',{method:'POST'});await refresh()};refresh()</script></html>`
func count(add bool) map[string]int { mu.Lock(); defer mu.Unlock(); p:=filepath.Join(os.Getenv("PODS_APP_DATA"),"count"); b,_:=os.ReadFile(p); n,_:=strconv.Atoi(string(b)); if add {n++; if err:=os.WriteFile(p,[]byte(strconv.Itoa(n)),0600);err!=nil{panic(err)}};return map[string]int{"count":n} }
func main(){r:=echo.New();r.GET("/",func(c *echo.Context)error{return c.HTML(200,page)});r.GET("/api/count",func(c *echo.Context)error{return c.JSON(200,count(false))});r.POST("/api/count",func(c *echo.Context)error{return c.JSON(200,count(true))});if err:=r.Start(":8080");err!=nil{panic(err)}}
