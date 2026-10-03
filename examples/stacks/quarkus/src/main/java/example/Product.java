package example;
import jakarta.ws.rs.*;
import java.util.Map;
@Path("/")
public class Product {
  @GET @Produces("text/html") public String page(){return "<!doctype html><html><title>Quarkus + SQLite</title><h1>Quarkus + SQLite</h1><p id=\"value\">Loading</p><button id=\"add\">Add one</button><script>async function refresh(){document.querySelector(\"#value\").textContent=(await(await fetch(\"/api/count\")).json()).count}document.querySelector(\"#add\").onclick=async()=>{await fetch(\"/api/count\",{method:\"POST\"});refresh()};refresh()</script></html>";}
  @GET @Path("api/count") @Produces("application/json") public Map<String,Integer> read() throws Exception{return Map.of("count",Counter.value(false));}
  @POST @Path("api/count") @Produces("application/json") public Map<String,Integer> add() throws Exception{return Map.of("count",Counter.value(true));}
}
