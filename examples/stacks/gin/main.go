package main
import("os";"path/filepath";"strconv";"sync";"github.com/gin-gonic/gin")
var mu sync.Mutex
const page=`<!doctype html><html><title>Gin counter</title><h1>Gin counter</h1><p id="value"></p><button id="add">Add one</button><script>async function refresh(){document.querySelector('#value').textContent=(await(await fetch('/api/count')).json()).count}document.querySelector('#add').onclick=async()=>{await fetch('/api/count',{method:'POST'});await refresh()};refresh()</script></html>`
func count(add bool) map[string]int { mu.Lock(); defer mu.Unlock(); p:=filepath.Join(os.Getenv("PODS_APP_DATA"),"count"); b,_:=os.ReadFile(p); n,_:=strconv.Atoi(string(b)); if add {n++; if err:=os.WriteFile(p,[]byte(strconv.Itoa(n)),0600);err!=nil{panic(err)}};return map[string]int{"count":n} }
func main(){r:=gin.Default();r.GET("/",func(c *gin.Context){c.Data(200,"text/html; charset=utf-8",[]byte(page))});r.GET("/api/count",func(c *gin.Context){c.JSON(200,count(false))});r.POST("/api/count",func(c *gin.Context){c.JSON(200,count(true))});if err:=r.Run(":8080");err!=nil{panic(err)}}
