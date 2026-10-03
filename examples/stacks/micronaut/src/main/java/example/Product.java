package example;
import io.micronaut.http.annotation.*;
import io.micronaut.scheduling.annotation.ExecuteOn;
import io.micronaut.scheduling.TaskExecutors;
import java.util.Map;
@Controller("/") @ExecuteOn(TaskExecutors.BLOCKING)
public class Product {
  @Get @Produces("text/html") public String page(){return "<!doctype html><html><title>Micronaut + SQLite</title><h1>Micronaut + SQLite</h1><p id=\"value\">Loading</p><button id=\"add\">Add one</button><script>async function refresh(){document.querySelector(\"#value\").textContent=(await(await fetch(\"/api/count\")).json()).count}document.querySelector(\"#add\").onclick=async()=>{await fetch(\"/api/count\",{method:\"POST\"});refresh()};refresh()</script></html>";}
  @Get("/api/count") @Produces("application/json") public Map<String,Integer> read() throws Exception{return Map.of("count",Counter.value(false));}
  @Post("/api/count") @Produces("application/json") public Map<String,Integer> add() throws Exception{return Map.of("count",Counter.value(true));}
}
