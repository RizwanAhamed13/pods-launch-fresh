defmodule PodsPhoenix.Repo do
  use Ecto.Repo, otp_app: :pods_phoenix, adapter: Ecto.Adapters.SQLite3
end

defmodule PodsPhoenix.Application do
  use Application
  def start(_type, _args) do
    {:ok, supervisor} = Supervisor.start_link([PodsPhoenix.Repo], strategy: :one_for_one)
    Ecto.Adapters.SQL.query!(PodsPhoenix.Repo, "CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)")
    Ecto.Adapters.SQL.query!(PodsPhoenix.Repo, "INSERT OR IGNORE INTO counter VALUES (1, 0)")
    {:ok, _} = Supervisor.start_child(supervisor, PodsPhoenix.Endpoint)
    {:ok, supervisor}
  end
end

defmodule PodsPhoenix.Router do
  use Phoenix.Router
  get "/", PodsPhoenix.ProductController, :index
  get "/api/count", PodsPhoenix.ProductController, :count
  post "/api/count", PodsPhoenix.ProductController, :increment
end

defmodule PodsPhoenix.ProductController do
  use Phoenix.Controller, formats: [:html, :json]
  def index(conn, _params), do: html(conn, File.read!(Application.app_dir(:pods_phoenix, "priv/product.html")))
  def count(conn, _params) do
    %{rows: [[value]]} = Ecto.Adapters.SQL.query!(PodsPhoenix.Repo, "SELECT value FROM counter WHERE id=1")
    json(conn, %{count: value})
  end
  def increment(conn, params) do
    Ecto.Adapters.SQL.query!(PodsPhoenix.Repo, "UPDATE counter SET value=value+1 WHERE id=1")
    count(conn, params)
  end
end

defmodule PodsPhoenix.ErrorHTML do
  def render(template, _), do: Phoenix.Controller.status_message_from_template(template)
end

defmodule PodsPhoenix.ErrorJSON do
  def render(template, _), do: %{error: Phoenix.Controller.status_message_from_template(template)}
end

defmodule PodsPhoenix.Endpoint do
  use Phoenix.Endpoint, otp_app: :pods_phoenix
  plug Plug.RequestId
  plug PodsPhoenix.Router
end
