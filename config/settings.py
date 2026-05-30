from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin','django.contrib.auth','django.contrib.contenttypes',
    'django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles',
    'rest_framework','rest_framework_simplejwt','rest_framework_simplejwt.token_blacklist','corsheaders',
    'channels',
    'apps.accounts','apps.clinics','apps.services','apps.customers',
    'apps.appointments','apps.contracts','apps.attendance','apps.salary','apps.chat','apps.kpi',
    'apps.integrations',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware','corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware','django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'config.urls'
TEMPLATES = [{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[BASE_DIR/'templates'],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.debug','django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db' / 'crm.sqlite3'}}

REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [REDIS_URL]},
    }
}

AUTH_PASSWORD_VALIDATORS = [{'NAME':'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},{'NAME':'django.contrib.auth.password_validation.MinimumLengthValidator'},{'NAME':'django.contrib.auth.password_validation.CommonPasswordValidator'},{'NAME':'django.contrib.auth.password_validation.NumericPasswordValidator'}]
LANGUAGE_CODE='vi'; TIME_ZONE='Asia/Ho_Chi_Minh'; USE_I18N=True; USE_TZ=True
STATIC_URL='/static/'; STATIC_ROOT=BASE_DIR/'staticfiles'
MEDIA_URL='/media/'; MEDIA_ROOT=BASE_DIR/'media'
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
AUTH_USER_MODEL='accounts.User'
REST_FRAMEWORK={'DEFAULT_AUTHENTICATION_CLASSES':('rest_framework_simplejwt.authentication.JWTAuthentication',),'DEFAULT_PERMISSION_CLASSES':('rest_framework.permissions.IsAuthenticated',),'DEFAULT_PAGINATION_CLASS':'rest_framework.pagination.PageNumberPagination','PAGE_SIZE':20}
SIMPLE_JWT={'ACCESS_TOKEN_LIFETIME':timedelta(minutes=config('ACCESS_TOKEN_LIFETIME_MINUTES',default=60,cast=int)),'REFRESH_TOKEN_LIFETIME':timedelta(days=config('REFRESH_TOKEN_LIFETIME_DAYS',default=7,cast=int)),'ROTATE_REFRESH_TOKENS':True,'BLACKLIST_AFTER_ROTATION':True,'UPDATE_LAST_LOGIN':True,'ALGORITHM':'HS256','AUTH_HEADER_TYPES':('Bearer',),'USER_ID_FIELD':'id','USER_ID_CLAIM':'user_id','TOKEN_OBTAIN_SERIALIZER':'apps.accounts.serializers.CustomTokenObtainPairSerializer'}
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS=True

# Zalo OA
ZALO_APP_ID=config('ZALO_APP_ID',default='')
ZALO_APP_SECRET=config('ZALO_APP_SECRET',default='')
FRONTEND_URL=config('FRONTEND_URL',default='http://localhost:3000')
