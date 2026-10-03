Rails.application.routes.draw do
  root 'product#index'
  get '/api/count', to: 'product#count'
  post '/api/count', to: 'product#increment'
end
