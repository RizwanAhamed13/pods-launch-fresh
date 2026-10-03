package example
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.routing.*
import io.ktor.server.response.*
import io.ktor.http.*
import java.nio.file.*
import java.sql.DriverManager
private val gate=Any()
private fun count(add:Boolean):Int=synchronized(gate){
  val data=Path.of(System.getenv("PODS_APP_DATA") ?: "/tmp/pods-ktor")
  Files.createDirectories(data);Class.forName("org.sqlite.JDBC")
  DriverManager.getConnection("jdbc:sqlite:"+data.resolve("counter.sqlite")).use { db -> db.createStatement().use { sql ->
    sql.execute("CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)")
    sql.execute("INSERT OR IGNORE INTO counter VALUES (1,0)")
    if(add)sql.executeUpdate("UPDATE counter SET value=value+1 WHERE id=1")
    sql.executeQuery("SELECT value FROM counter WHERE id=1").use { row -> row.next();row.getInt(1) }
  }}
}
fun main(){embeddedServer(Netty,port=8080,host="0.0.0.0") { routing {
  get("/"){call.respondText("""<!doctype html><html><title>Ktor + SQLite</title><h1>Ktor + SQLite</h1><p id="value">Loading</p><button id="add">Add one</button><script>async function refresh(){document.querySelector("#value").textContent=(await(await fetch("/api/count")).json()).count}document.querySelector("#add").onclick=async()=>{await fetch("/api/count",{method:"POST"});refresh()};refresh()</script></html>""",ContentType.Text.Html)}
  get("/api/count"){call.respondText("""{"count":${count(false)}}""",ContentType.Application.Json)}
  post("/api/count"){call.respondText("""{"count":${count(true)}}""",ContentType.Application.Json)}
}}.start(wait=true)}
