import Config
folder = System.get_env("PODS_APP_DATA", "/data")
File.mkdir_p!(folder)
config :pods_phoenix, PodsPhoenix.Repo, database: Path.join(folder, "counter.sqlite"), pool_size: 1
config :pods_phoenix, PodsPhoenix.Endpoint,
  server: true,
  http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PORT", "8080"))],
  secret_key_base: Base.encode64(:crypto.strong_rand_bytes(48)),
  render_errors: [formats: [html: PodsPhoenix.ErrorHTML, json: PodsPhoenix.ErrorJSON], layout: false]
