package example;
import org.springframework.boot.*;import org.springframework.boot.autoconfigure.*;import org.springframework.web.bind.annotation.*;import java.nio.file.*;import java.sql.*;import java.util.*;
@SpringBootApplication @RestController public class Product {
 public static void main(String[] args){SpringApplication.run(Product.class,args);}
 @GetMapping(value="/",produces="text/html") public String home(){return "<!doctype html><html><title>Spring Boot counter</title><h1>Spring Boot counter</h1><p id=\"value\"></p><button id=\"add\">Add one</button><script>async function refresh(){document.querySelector(\"#value\").textContent=(await(await fetch(\"/api/count\")).json()).count}document.querySelector(\"#add\").onclick=async()=>{await fetch(\"/api/count\",{method:\"POST\"});refresh()};refresh()</script></html>";}
 synchronized int count(boolean add) throws Exception {
  Path p=Path.of(System.getenv().getOrDefault("PODS_APP_DATA","/data"),"counter.sqlite");
  Files.createDirectories(p.getParent());
  try(Connection db=DriverManager.getConnection("jdbc:sqlite:"+p);Statement sql=db.createStatement()){
   sql.executeUpdate("CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY CHECK(id=1), value INTEGER NOT NULL)");
   sql.executeUpdate("INSERT OR IGNORE INTO counter(id,value) VALUES(1,0)");
   if(add)sql.executeUpdate("UPDATE counter SET value=value+1 WHERE id=1");
   try(ResultSet rows=sql.executeQuery("SELECT value FROM counter WHERE id=1")){if(!rows.next())throw new SQLException("Counter row missing");return rows.getInt(1);}
  }
 }
 @GetMapping("/api/count") public Map<String,Integer> read() throws Exception{return Map.of("count",count(false));}
 @PostMapping("/api/count") public Map<String,Integer> add() throws Exception{return Map.of("count",count(true));}
}
