import Config
config :pods_phoenix, ecto_repos: [PodsPhoenix.Repo]
config :phoenix, :json_library, Jason
config :pods_phoenix, PodsPhoenix.Endpoint, adapter: Bandit.PhoenixAdapter
