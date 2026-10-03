require_relative 'boot'
require 'rails'
require 'active_record/railtie'
require 'action_controller/railtie'
Bundler.require(*Rails.groups)
module CounterProduct
  class Application < Rails::Application
    config.load_defaults 8.0
    config.api_only = true
    config.eager_load = true
    config.secret_key_base = 'public-counter-fixture-' * 8
    config.logger = Logger.new($stdout)
    config.hosts = ['localhost', '127.0.0.1', /.*\.cloudshell\.dev/, /.*\.app\.github\.dev/]
  end
end
