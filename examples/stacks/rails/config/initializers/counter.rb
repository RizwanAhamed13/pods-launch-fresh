require 'fileutils'
FileUtils.mkdir_p(ENV.fetch('PODS_APP_DATA', '/data'))
ActiveRecord::Base.connection.execute('CREATE TABLE IF NOT EXISTS counters (id INTEGER PRIMARY KEY, value INTEGER NOT NULL)')
ActiveRecord::Base.connection.execute('INSERT OR IGNORE INTO counters VALUES (1,0)')
