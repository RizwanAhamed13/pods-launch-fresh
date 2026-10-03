package example;
import java.nio.file.*;
import java.sql.*;
final class Counter {
  static synchronized int value(boolean increment) throws Exception {
    Path data=Path.of(System.getenv().getOrDefault("PODS_APP_DATA","/tmp/pods-counter"));
    Files.createDirectories(data);Class.forName("org.sqlite.JDBC");
    try(Connection db=DriverManager.getConnection("jdbc:sqlite:"+data.resolve("counter.sqlite"));Statement sql=db.createStatement()){
      sql.execute("CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)");
      sql.execute("INSERT OR IGNORE INTO counter VALUES (1,0)");
      if(increment)sql.executeUpdate("UPDATE counter SET value=value+1 WHERE id=1");
      try(ResultSet row=sql.executeQuery("SELECT value FROM counter WHERE id=1")){row.next();return row.getInt(1);}
    }
  }
}
