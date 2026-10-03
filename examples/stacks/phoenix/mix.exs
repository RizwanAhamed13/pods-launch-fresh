defmodule PodsPhoenix.MixProject do
  use Mix.Project
  def project, do: [app: :pods_phoenix, version: "0.1.0", elixir: "~> 1.18", start_permanent: Mix.env() == :prod, deps: deps()]
  def application, do: [mod: {PodsPhoenix.Application, []}, extra_applications: [:logger]]
  defp deps, do: [{:phoenix, "~> 1.8.0"}, {:bandit, "~> 1.7"}, {:ecto_sql, "~> 3.13"}, {:ecto_sqlite3, "~> 0.25.0"}, {:jason, "~> 1.4"}]
end
