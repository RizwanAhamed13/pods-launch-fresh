package example;
import org.springframework.boot.*;import org.springframework.boot.autoconfigure.*;import org.springframework.web.bind.annotation.*;import java.nio.file.*;import java.util.*;
@SpringBootApplication @RestController public class Product {
 public static void main(String[] args){SpringApplication.run(Product.class,args);}
 @GetMapping(value="/",produces="text/html") public String home(){return "<!doctype html><html><title>Spring Boot counter</title><h1>Spring Boot counter</h1><p id=\"value\"></p><button id=\"add\">Add one</button><script>async function refresh(){document.querySelector(\"#value\").textContent=(await(await fetch(\"/api/count\")).json()).count}document.querySelector(\"#add\").onclick=async()=>{await fetch(\"/api/count\",{method:\"POST\"});refresh()};refresh()</script></html>";}
 synchronized int count(boolean add) throws Exception {Path p=Path.of(System.getenv().getOrDefault("PODS_APP_DATA","/data"),"count");int n=Files.exists(p)?Integer.parseInt(Files.readString(p)):0;if(add){n++;Files.createDirectories(p.getParent());Files.writeString(p,""+n);}return n;}
 @GetMapping("/api/count") public Map<String,Integer> read() throws Exception{return Map.of("count",count(false));}
 @PostMapping("/api/count") public Map<String,Integer> add() throws Exception{return Map.of("count",count(true));}
}
