<?php
Illuminate\Support\Facades\Route::get('/', fn() => response(file_get_contents(resource_path('product.html'))));
