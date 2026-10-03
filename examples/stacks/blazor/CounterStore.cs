using Microsoft.Data.Sqlite;
namespace PodsBlazor;
public class CounterStore {
  private readonly object gate=new();
  public int Value(bool add){lock(gate){
    var data=Environment.GetEnvironmentVariable("PODS_APP_DATA") ?? "/tmp/pods-blazor";
    Directory.CreateDirectory(data);
    using var db=new SqliteConnection(new SqliteConnectionStringBuilder{DataSource=Path.Combine(data,"counter.sqlite")}.ToString());
    db.Open();using var command=db.CreateCommand();
    command.CommandText="CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL); INSERT OR IGNORE INTO counter VALUES (1,0)";command.ExecuteNonQuery();
    if(add){command.CommandText="UPDATE counter SET value=value+1 WHERE id=1";command.ExecuteNonQuery();}
    command.CommandText="SELECT value FROM counter WHERE id=1";return Convert.ToInt32(command.ExecuteScalar());
  }}
}
