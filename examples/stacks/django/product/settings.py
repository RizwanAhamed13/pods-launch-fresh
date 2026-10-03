import os
SECRET_KEY='public-fixture-only'
DEBUG=False
ALLOWED_HOSTS=['*']
ROOT_URLCONF='product.urls'
INSTALLED_APPS=[]
DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':os.environ.get('PODS_APP_DATA','/data')+'/db.sqlite3'}}
