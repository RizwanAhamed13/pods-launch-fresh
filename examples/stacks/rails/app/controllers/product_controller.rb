class ProductController < ActionController::API
  def index
    render html: File.read(Rails.root.join('product.html')).html_safe
  end
  def count
    render json: {count: ActiveRecord::Base.connection.select_value('SELECT value FROM counters WHERE id=1').to_i}
  end
  def increment
    ActiveRecord::Base.connection.execute('UPDATE counters SET value=value+1 WHERE id=1')
    count
  end
end
